import { writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { execSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import { createUnzip } from 'node:zlib'

const FONTS_DIR = join(process.cwd(), '.fonts')
const REGULAR_PATH = join(FONTS_DIR, 'noto-sans-sc-regular.otf')
const BOLD_PATH = join(FONTS_DIR, 'noto-sans-sc-bold.otf')

// Simplified Chinese OTF zip from Noto Sans CJK release
const ZIP_URL =
  'https://github.com/notofonts/noto-cjk/releases/download/Sans2.004/08_NotoSansCJKsc.zip'

async function downloadZip(url, destDir) {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Node.js' },
    signal: AbortSignal.timeout(120000),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)

  // Write zip to temp file and extract using PowerShell on Windows, or unzip on Unix
  const tmpZip = join(destDir, '_temp.zip')
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(tmpZip, buf)
  console.log(`  Downloaded ${(buf.length / 1024).toFixed(0)}KB zip`)

  try {
    if (process.platform === 'win32') {
      execSync(
        `powershell -Command "Expand-Archive -Path '${tmpZip}' -DestinationPath '${destDir}' -Force"`,
        { stdio: 'pipe' },
      )
    } else {
      execSync(`unzip -o "${tmpZip}" -d "${destDir}"`, { stdio: 'pipe' })
    }
    console.log('  Extracted zip')
  } finally {
    // Clean up temp zip
    const fs = await import('node:fs')
    fs.unlinkSync(tmpZip)
  }
}

function findFont(dir, pattern) {
  try {
    const files = readdirSync(dir, { recursive: true })
    return files.find((f) => f.includes(pattern))
  } catch {
    return null
  }
}

async function tryDownloadAndExtract() {
  const tmpDir = join(FONTS_DIR, '_extract')
  if (!existsSync(tmpDir)) mkdirSync(tmpDir, { recursive: true })

  await downloadZip(ZIP_URL, tmpDir)

  const regular = findFont(tmpDir, 'NotoSansSC-Regular.otf')
  const bold = findFont(tmpDir, 'NotoSansSC-Bold.otf')

  if (regular) copyFileSync(join(tmpDir, regular), REGULAR_PATH)
  if (bold) copyFileSync(join(tmpDir, bold), BOLD_PATH)

  // Cleanup
  try {
    const fs = await import('node:fs')
    fs.rmSync(tmpDir, { recursive: true, force: true })
  } catch {}
}

async function tryWindowsSystemFont() {
  const winFonts = ['C:\\Windows\\Fonts', '/c/Windows/Fonts']
  for (const dir of winFonts) {
    const simhei = join(dir, 'simhei.ttf')
    if (existsSync(simhei)) {
      console.log('  Using Windows system font SimHei as fallback')
      copyFileSync(simhei, REGULAR_PATH)
      copyFileSync(simhei, BOLD_PATH)
      return true
    }
  }
  return false
}

async function main() {
  if (!existsSync(FONTS_DIR)) {
    mkdirSync(FONTS_DIR, { recursive: true })
  }

  if (existsSync(REGULAR_PATH) && existsSync(BOLD_PATH)) {
    console.log('OG fonts already present.')
    return
  }

  console.log('Setting up fonts for OG image generation...')

  if (!existsSync(REGULAR_PATH) || !existsSync(BOLD_PATH)) {
    try {
      console.log('Downloading Noto Sans SC from GitHub release...')
      await tryDownloadAndExtract()
    } catch (e) {
      console.log(`  Download failed: ${e.message}`)
    }
  }

  if (!existsSync(REGULAR_PATH) || !existsSync(BOLD_PATH)) {
    console.log('Trying system font fallback...')
    const ok = await tryWindowsSystemFont()
    if (!ok) {
      console.error('\nFailed to obtain fonts. OG image generation will be skipped.')
      console.error('Manually place Noto Sans SC OTF files at:')
      console.error(`  ${REGULAR_PATH}`)
      console.error(`  ${BOLD_PATH}`)
      console.error('Or download from:')
      console.error(`  ${ZIP_URL}`)
    }
  }

  if (existsSync(REGULAR_PATH) && existsSync(BOLD_PATH)) {
    console.log('Fonts ready.')
  }
}

main()
