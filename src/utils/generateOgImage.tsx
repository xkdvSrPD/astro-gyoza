import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import sharp from 'sharp'
import config from '@/config.json'
import type { ReactElement } from 'react'

interface OgImageOptions {
  title: string
  description?: string
  type?: 'post' | 'page'
  category?: string
  date?: Date
}

// Load fonts
const notoSansRegularFont = readFileSync(
  join(process.cwd(), 'public/fonts/noto-sans-sc-400.woff')
)
const notoSansBoldFont = readFileSync(join(process.cwd(), 'public/fonts/noto-sans-sc-700.woff'))

export async function generateOgImage(
  slug: string,
  options: OgImageOptions
): Promise<string> {
  const { title, description, type = 'page', category, date } = options

  // Select accent color (use first one for consistency, or could randomize)
  const accentColor = config.color.accent[0].light
  const bgColor = '#ffffff'
  const textPrimary = '#373a3c'
  const textSecondary = '#71717a'

  const svg = await satori(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: bgColor,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative gradient background */}
      <div
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${accentColor}20, ${accentColor}10)`,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 600,
          height: 600,
          borderRadius: '50%',
          background: `linear-gradient(45deg, ${accentColor}15, ${accentColor}05)`,
          filter: 'blur(80px)',
        }}
      />

      {/* Content container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '80px',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Category or type badge */}
          {(category || type === 'post') && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <div
                style={{
                  background: accentColor,
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                }}
              />
              <div
                style={{
                  fontSize: 28,
                  color: accentColor,
                  fontWeight: 600,
                  fontFamily: 'Noto Sans SC',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {category || (type === 'post' ? 'Blog Post' : 'Page')}
              </div>
            </div>
          )}

          {/* Title */}
          <div
            style={{
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
            }}
          >
            {title}
          </div>

          {/* Description */}
          {description && (
            <div
              style={{
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
              }}
            >
              {description}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '100%',
          }}
        >
          {/* Site info */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div
              style={{
                fontSize: 36,
                color: textPrimary,
                fontWeight: 700,
                fontFamily: 'Noto Sans SC',
              }}
            >
              {config.site.title}
            </div>
            <div
              style={{
                fontSize: 24,
                color: textSecondary,
                fontFamily: 'Noto Sans SC',
              }}
            >
              {config.site.url.replace(/^https?:\/\//, '')}
            </div>
          </div>

          {/* Date if provided */}
          {date && (
            <div
              style={{
                fontSize: 24,
                color: textSecondary,
                fontFamily: 'Noto Sans SC',
              }}
            >
              {new Date(date).toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          )}
        </div>
      </div>
    </div> as ReactElement,
    {
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
    }
  )

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

  // Ensure directory exists
  const outputDir = join(process.cwd(), 'dist/og')
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Generate filename from slug
  const filename = `${slug.replace(/\//g, '-')}.png`
  const outputPath = join(outputDir, filename)

  // Write file
  writeFileSync(outputPath, optimizedBuffer)

  // Return the public URL path
  return `/og/${filename}`
}
