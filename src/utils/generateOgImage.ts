import satori from 'satori'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
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

function appendChild(target: SatoriRenderable[], child: SatoriChild) {
  if (child === null || child === undefined || child === false) return
  if (Array.isArray(child)) {
    child.forEach((nestedChild) => appendChild(target, nestedChild))
    return
  }
  target.push(child)
}

function element(type: string, props: SatoriElement['props'] = {}, ...children: SatoriChild[]) {
  const normalizedChildren: SatoriRenderable[] = []
  children.forEach((child) => appendChild(normalizedChildren, child))
  if (!normalizedChildren.length) return { type, props }
  return {
    type,
    props: {
      ...props,
      children: normalizedChildren.length === 1 ? normalizedChildren[0] : normalizedChildren,
    },
  }
}

const FONTS_DIR = join(process.cwd(), '.fonts')

function loadFont(filename: string): Buffer | null {
  const path = join(FONTS_DIR, filename)
  if (existsSync(path)) return readFileSync(path)
  return null
}

const regularFont = loadFont('noto-sans-sc-regular.otf')
const boldFont = loadFont('noto-sans-sc-bold.otf')

const isDev = import.meta.env.DEV

// cgit-theme colors
const BG = '#ffffff'
const BAND_BG = '#eeeeee'
const BORDER = '#cccccc'
const TITLE_COLOR = '#000000'
const MUTED = '#777777'

export async function generateOgImage(slug: string, options: OgImageOptions): Promise<string> {
  const { title, description, type = 'page', category, date } = options

  if (!regularFont || !boldFont) {
    if (isDev) {
      return `/og/placeholder.png`
    }
    throw new Error('OG fonts not found. Run "node scripts/download-fonts.js" to download them.')
  }

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
    version: 3,
  })
  const hash = createHash('sha1').update(cacheKey).digest('hex').slice(0, 10)
  const filename = `${normalizedSlug}-${hash}.png`

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

  const { Resvg } = await import('@resvg/resvg-js')

  const siteTitle = config.site.title
  const domain = config.site.url.replace(/^https?:\/\//, '')

  const label = category || (type === 'post' ? 'Blog Post' : 'Page')
  const dateStr = date
    ? new Date(date).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const ogTree = element(
    'div',
    {
      style: {
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: BG,
        fontFamily: 'Noto Sans SC',
      },
    },
    // Top border accent
    element('div', {
      style: {
        height: 4,
        background: BORDER,
        width: '100%',
      },
    }),
    // Header band — site title only
    element(
      'div',
      {
        style: {
          display: 'flex',
          alignItems: 'baseline',
          padding: '28px 64px',
          background: BAND_BG,
          borderBottom: `3px solid ${BORDER}`,
        },
      },
      element(
        'div',
        {
          style: {
            fontSize: 56,
            fontWeight: 700,
            color: TITLE_COLOR,
            lineHeight: 1,
          },
        },
        siteTitle,
      ),
    ),
    // Main content area
    element(
      'div',
      {
        style: {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          padding: '48px 64px',
          justifyContent: 'center',
          gap: '16px',
        },
      },
      // Category label
      element(
        'div',
        {
          style: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          },
        },
        element('div', {
          style: {
            width: 8,
            height: 8,
            background: MUTED,
          },
        }),
        element(
          'div',
          {
            style: {
              fontSize: 24,
              color: MUTED,
              fontWeight: 600,
              letterSpacing: '0.05em',
            },
          },
          label,
        ),
      ),
      // Title
      element(
        'div',
        {
          style: {
            fontSize: title.length > 40 ? 40 : 48,
            color: TITLE_COLOR,
            fontWeight: 700,
            lineHeight: 1.15,
            maxWidth: '90%',
          },
        },
        title,
      ),
      // Description
      description
        ? element(
            'div',
            {
              style: {
                fontSize: 28,
                color: MUTED,
                lineHeight: 1.4,
                maxWidth: '85%',
                marginTop: 8,
              },
            },
            description,
          )
        : false,
    ),
    // Footer — domain and date
    element(
      'div',
      {
        style: {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '28px 64px',
          borderTop: `1px solid ${BORDER}`,
        },
      },
      element(
        'div',
        {
          style: {
            fontSize: 24,
            color: MUTED,
          },
        },
        domain,
      ),
      dateStr
        ? element(
            'div',
            {
              style: {
                fontSize: 24,
                color: MUTED,
              },
            },
            dateStr,
          )
        : false,
    ),
  )

  const svg = await satori(ogTree, {
    width: 1200,
    height: 630,
    fonts: [
      { name: 'Noto Sans SC', data: regularFont, weight: 400, style: 'normal' },
      { name: 'Noto Sans SC', data: boldFont, weight: 700, style: 'normal' },
    ],
  })

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: 1200 },
  })

  const pngData = resvg.render()
  const pngBuffer = pngData.asPng()

  const optimizedBuffer = await sharp(pngBuffer)
    .png({ quality: 90, compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer()

  writeFileSync(
    outputPath,
    new Uint8Array(optimizedBuffer.buffer, optimizedBuffer.byteOffset, optimizedBuffer.byteLength),
  )

  return `/og/${filename}`
}
