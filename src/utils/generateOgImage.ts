import satori from 'satori'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'path'
import { createHash } from 'node:crypto'
import sharp from 'sharp'
import config from '@/config'

interface OgImageOptions {
  title: string
  description?: string
  type?: 'post' | 'page'
  category?: string
  date?: Date
}

type SatoriStyle = Record<string, string | number>
type SatoriRenderable = string | number | SatoriElement
type SatoriChild = SatoriRenderable | SatoriChild[] | null | undefined | false

interface SatoriElement {
  type: string
  props: {
    children?: SatoriRenderable | SatoriRenderable[]
    style?: SatoriStyle
    [key: string]: unknown
  }
}

// Skip OG image generation in dev mode to avoid native module issues
const isDev = import.meta.env.DEV

// Load fonts
const notoSansRegularFont = readFileSync(join(process.cwd(), 'public/fonts/noto-sans-sc-400.woff'))
const notoSansBoldFont = readFileSync(join(process.cwd(), 'public/fonts/noto-sans-sc-700.woff'))

function appendChild(target: SatoriRenderable[], child: SatoriChild) {
  if (child === null || child === undefined || child === false) {
    return
  }

  if (Array.isArray(child)) {
    child.forEach((nestedChild) => {
      appendChild(target, nestedChild)
    })
    return
  }

  target.push(child)
}

function element(type: string, props: SatoriElement['props'] = {}, ...children: SatoriChild[]) {
  const normalizedChildren: SatoriRenderable[] = []
  children.forEach((child) => {
    appendChild(normalizedChildren, child)
  })

  if (!normalizedChildren.length) {
    return { type, props }
  }

  return {
    type,
    props: {
      ...props,
      children: normalizedChildren.length === 1 ? normalizedChildren[0] : normalizedChildren,
    },
  }
}

export async function generateOgImage(slug: string, options: OgImageOptions): Promise<string> {
  const { title, description, type = 'page', category, date } = options

  const normalizedSlug = slug.replace(/\//g, '-')
  const cacheKey = JSON.stringify({
    slug: normalizedSlug,
    title,
    description: description || '',
    type,
    category: category || '',
    date: date ? new Date(date).toISOString() : '',
    siteTitle: config.site.title,
    siteUrl: config.site.url,
    version: 1,
  })
  const hash = createHash('sha1').update(cacheKey).digest('hex').slice(0, 10)
  const filename = `${normalizedSlug}-${hash}.png`

  // In dev mode, return placeholder path without generating
  if (isDev) {
    return `/og/${filename}`
  }

  const outputDir = join(process.cwd(), 'public/og')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  const outputPath = join(outputDir, filename)
  if (existsSync(outputPath)) {
    return `/og/${filename}`
  }

  // Dynamic import to avoid loading native module in dev
  const { Resvg } = await import('@resvg/resvg-js')

  // Select accent color (use first one for consistency, or could randomize)
  const accentColor = '#A78BFA'
  const bgColor = '#ffffff'
  const textPrimary = '#373a3c'
  const textSecondary = '#71717a'

  const ogTree = element(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: bgColor,
        position: 'relative',
        overflow: 'hidden',
      },
    },
    element('div', {
      style: {
        position: 'absolute',
        top: -100,
        right: -100,
        width: 500,
        height: 500,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
        filter: 'blur(60px)',
      },
    }),
    element('div', {
      style: {
        position: 'absolute',
        bottom: -150,
        left: -150,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background: `linear-gradient(45deg, ${accentColor}15, ${accentColor}05)`,
        filter: 'blur(80px)',
      },
    }),
    element(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '80px',
          position: 'relative',
        },
      },
      element(
        'div',
        {
          style: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          },
        },
        (category || type === 'post') &&
          element(
            'div',
            {
              style: {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              },
            },
            element('div', {
              style: {
                background: accentColor,
                width: 6,
                height: 6,
                borderRadius: '50%',
              },
            }),
            element(
              'div',
              {
                style: {
                  fontSize: 28,
                  color: accentColor,
                  fontWeight: 600,
                  fontFamily: 'Noto Sans SC',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                },
              },
              category || (type === 'post' ? 'Blog Post' : 'Page'),
            ),
          ),
        element(
          'div',
          {
            style: {
              fontSize: title.length > 50 ? 56 : 72,
              color: textPrimary,
              fontWeight: 700,
              fontFamily: 'Noto Sans SC',
              lineHeight: 1.1,
              maxWidth: '90%',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            },
          },
          title,
        ),
        description &&
          element(
            'div',
            {
              style: {
                fontSize: 32,
                color: textSecondary,
                fontFamily: 'Noto Sans SC',
                lineHeight: 1.5,
                maxWidth: '85%',
                marginTop: 20,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              },
            },
            description,
          ),
      ),
      element(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
          },
        },
        element(
          'div',
          {
            style: {
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            },
          },
          element(
            'div',
            {
              style: {
                fontSize: 36,
                color: textPrimary,
                fontWeight: 700,
                fontFamily: 'Noto Sans SC',
              },
            },
            config.site.title,
          ),
          element(
            'div',
            {
              style: {
                fontSize: 24,
                color: textSecondary,
                fontFamily: 'Noto Sans SC',
              },
            },
            config.site.url.replace(/^https?:\/\//, ''),
          ),
        ),
        date &&
          element(
            'div',
            {
              style: {
                fontSize: 24,
                color: textSecondary,
                fontFamily: 'Noto Sans SC',
              },
            },
            new Date(date).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          ),
      ),
    ),
  )

  const svg = await satori(ogTree, {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: 'Noto Sans SC',
        data: notoSansRegularFont,
        weight: 400,
        style: 'normal',
      },
      {
        name: 'Noto Sans SC',
        data: notoSansBoldFont,
        weight: 700,
        style: 'normal',
      },
    ],
  })

  // Convert SVG to PNG using resvg
  const resvg = new Resvg(svg, {
    fitTo: {
      mode: 'width',
      value: 1200,
    },
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  // Optimize PNG with sharp
  const optimizedBuffer = await sharp(pngBuffer)
    .png({
      quality: 90,
      compressionLevel: 9,
      adaptiveFiltering: true,
    })
    .toBuffer()

  // Write file
  const outputBytes = new Uint8Array(
    optimizedBuffer.buffer,
    optimizedBuffer.byteOffset,
    optimizedBuffer.byteLength,
  )
  writeFileSync(outputPath, outputBytes)

  // Return the public URL path
  return `/og/${filename}`
}
