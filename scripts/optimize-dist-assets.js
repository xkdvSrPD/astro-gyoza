import { existsSync } from 'node:fs'
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { extname, join, basename } from 'node:path'
import sharp from 'sharp'

const DIST_DIR = join(process.cwd(), 'dist')
const ASSET_DIRS = ['image', 'og', 'avatar']
const TEXT_EXTENSIONS = new Set(['.css', '.html', '.js', '.json', '.svg', '.txt', '.xml'])

const stats = {
  prunedFiles: 0,
  prunedBytes: 0,
  convertedFiles: 0,
  convertedBytes: 0,
  optimizedFiles: 0,
  optimizedBytes: 0,
}

async function walk(dir) {
  if (!existsSync(dir)) {
    return []
  }

  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        return await walk(fullPath)
      }
      return fullPath
    }),
  )

  return files.flat()
}

function isTextFile(file) {
  return TEXT_EXTENSIONS.has(extname(file).toLowerCase())
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

async function collectReferences() {
  const references = new Map(ASSET_DIRS.map((dir) => [dir, new Set()]))
  const textFiles = []
  const files = await walk(DIST_DIR)

  for (const file of files) {
    if (!isTextFile(file)) {
      continue
    }

    const content = await readFile(file, 'utf8')
    textFiles.push({ file, content })

    const assetPattern =
      /(?:https?:\/\/[^"'()<>\s]+)?\/(image|og|avatar)\/([^"'()<>\s?#]+)(?:[?#][^"'()<>\s]*)?/g
    for (const match of content.matchAll(assetPattern)) {
      references.get(match[1])?.add(basename(safeDecode(match[2])))
    }
  }

  return { references, textFiles }
}

async function rewriteReferences(textFiles, dir, fromName, toName) {
  const encodedFromName = encodeURI(fromName)
  const encodedToName = encodeURI(toName)
  const replacements = [
    [`/${dir}/${fromName}`, `/${dir}/${toName}`],
    [`/${dir}/${encodedFromName}`, `/${dir}/${encodedToName}`],
  ]

  for (const textFile of textFiles) {
    let next = textFile.content
    for (const [fromValue, toValue] of replacements) {
      next = next.split(fromValue).join(toValue)
    }

    if (next !== textFile.content) {
      textFile.content = next
      await writeFile(textFile.file, next)
    }
  }
}

async function removeFile(file) {
  try {
    await rm(file, { force: true })
    return true
  } catch (error) {
    console.warn(`  skipped locked file: ${file}`)
    console.warn(`  ${error.message}`)
    return false
  }
}

async function convertReferencedGifAvatars(references, textFiles) {
  const avatarDir = join(DIST_DIR, 'avatar')
  if (!existsSync(avatarDir)) {
    return
  }

  const avatars = Array.from(references.get('avatar') || [])
  for (const name of avatars) {
    if (extname(name).toLowerCase() !== '.gif') {
      continue
    }

    const inputPath = join(avatarDir, name)
    if (!existsSync(inputPath)) {
      continue
    }

    const outputName = `${name.slice(0, -extname(name).length)}.webp`
    const outputPath = join(avatarDir, outputName)
    const original = await readFile(inputPath)
    const originalSize = original.length
    const optimized = await sharp(original, { animated: false })
      .resize(96, 96, { fit: 'cover', withoutEnlargement: true })
      .webp({ quality: 82, effort: 5 })
      .toBuffer()

    if (optimized.length >= originalSize) {
      continue
    }

    await writeFile(outputPath, optimized)
    await rewriteReferences(textFiles, 'avatar', name, outputName)
    await removeFile(inputPath)
    references.get('avatar')?.delete(name)
    references.get('avatar')?.add(outputName)

    stats.convertedFiles += 1
    stats.convertedBytes += originalSize - optimized.length
  }
}

async function pruneUnreferencedAssets(references) {
  for (const dir of ASSET_DIRS) {
    const assetDir = join(DIST_DIR, dir)
    if (!existsSync(assetDir)) {
      continue
    }

    const used = references.get(dir) || new Set()
    const entries = await readdir(assetDir, { withFileTypes: true })
    for (const entry of entries) {
      if (!entry.isFile() || used.has(entry.name)) {
        continue
      }

      const file = join(assetDir, entry.name)
      const size = (await stat(file)).size
      if (await removeFile(file)) {
        stats.prunedFiles += 1
        stats.prunedBytes += size
      }
    }
  }
}

async function optimizeRaster(file, options) {
  const original = await readFile(file)
  const originalSize = original.length
  const extension = extname(file).toLowerCase()

  if (!['.jpeg', '.jpg', '.png', '.webp'].includes(extension)) {
    return
  }

  const metadata = await sharp(original, { animated: false }).metadata()
  if (!metadata.width) {
    return
  }

  const shouldResize = options.maxWidth && metadata.width > options.maxWidth
  const shouldRecompress = originalSize > options.minBytes
  if (!shouldResize && !shouldRecompress) {
    return
  }

  let pipeline = sharp(original, { animated: false }).rotate()
  if (shouldResize) {
    pipeline = pipeline.resize({ width: options.maxWidth, withoutEnlargement: true })
  }

  if (extension === '.webp') {
    pipeline = pipeline.webp({ quality: options.quality, effort: 5 })
  } else if (extension === '.png') {
    pipeline = pipeline.png({ compressionLevel: 9, adaptiveFiltering: true })
  } else {
    pipeline = pipeline.jpeg({ quality: options.quality, mozjpeg: true })
  }

  const optimized = await pipeline.toBuffer()
  if (optimized.length >= originalSize) {
    return
  }

  await writeFile(file, optimized)
  stats.optimizedFiles += 1
  stats.optimizedBytes += originalSize - optimized.length
}

async function optimizeImages() {
  const imageDir = join(DIST_DIR, 'image')
  if (existsSync(imageDir)) {
    const images = await readdir(imageDir, { withFileTypes: true })
    for (const entry of images) {
      if (entry.isFile()) {
        await optimizeRaster(join(imageDir, entry.name), {
          maxWidth: 1600,
          minBytes: 256 * 1024,
          quality: 84,
        })
      }
    }
  }

  const avatarDir = join(DIST_DIR, 'avatar')
  if (existsSync(avatarDir)) {
    const avatars = await readdir(avatarDir, { withFileTypes: true })
    for (const entry of avatars) {
      if (entry.isFile()) {
        await optimizeRaster(join(avatarDir, entry.name), {
          maxWidth: 96,
          minBytes: 32 * 1024,
          quality: 82,
        })
      }
    }
  }
}

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    throw new Error('dist directory not found. Run astro build first.')
  }

  const { references, textFiles } = await collectReferences()
  await convertReferencedGifAvatars(references, textFiles)
  await pruneUnreferencedAssets(references)
  await optimizeImages()

  console.log(
    [
      'Optimized dist assets:',
      `  pruned ${stats.prunedFiles} files (${formatBytes(stats.prunedBytes)})`,
      `  converted ${stats.convertedFiles} GIF avatars (${formatBytes(stats.convertedBytes)})`,
      `  recompressed ${stats.optimizedFiles} images (${formatBytes(stats.optimizedBytes)})`,
    ].join('\n'),
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
