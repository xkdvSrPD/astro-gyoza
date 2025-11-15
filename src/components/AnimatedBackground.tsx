import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import type { ISourceOptions } from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

type Triplet = [number, number, number]

interface Palette {
  accent: Triplet
  neutral: Triplet
  backdrop: Triplet
}

const DEFAULT_PALETTE: Palette = {
  accent: [245, 85, 85],
  neutral: [113, 113, 122],
  backdrop: [0, 2, 18],
}

const tripletFromCssVar = (value: string, fallback: Triplet): Triplet => {
  const parsed = value
    .trim()
    .replace(/,/g, ' ')
    .split(/\s+/)
    .map((segment) => Number.parseFloat(segment))
    .filter((segment) => Number.isFinite(segment)) as number[]

  return [
    parsed[0] ?? fallback[0],
    parsed[1] ?? fallback[1],
    parsed[2] ?? fallback[2],
  ]
}

const readPalette = (): Palette => {
  if (typeof window === 'undefined') return DEFAULT_PALETTE

  const styles = getComputedStyle(document.documentElement)
  return {
    accent: tripletFromCssVar(styles.getPropertyValue('--color-accent'), DEFAULT_PALETTE.accent),
    neutral: tripletFromCssVar(
      styles.getPropertyValue('--color-text-secondary'),
      DEFAULT_PALETTE.neutral,
    ),
    backdrop: tripletFromCssVar(styles.getPropertyValue('--color-bg-root'), DEFAULT_PALETTE.backdrop),
  }
}

const tripletToRgb = (value: Triplet) => `rgb(${value[0]}, ${value[1]}, ${value[2]})`
const tripletToRgba = (value: Triplet, alpha: number) =>
  `rgba(${value[0]}, ${value[1]}, ${value[2]}, ${alpha})`

const useReducedMotion = () => {
  const [reduceMotion, setReduceMotion] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReduceMotion(mediaQuery.matches)

    handleChange()
    mediaQuery.addEventListener('change', handleChange)

    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  return reduceMotion
}

export function AnimatedBackground() {
  const [palette, setPalette] = useState<Palette>(DEFAULT_PALETTE)
  const [ready, setReady] = useState(false)
  const [isDensePage, setIsDensePage] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const schedulePaletteUpdate = () => {
      if (typeof window === 'undefined' || typeof window.requestAnimationFrame !== 'function') {
        setPalette(readPalette())
        return
      }

      window.requestAnimationFrame(() => setPalette(readPalette()))
    }

    schedulePaletteUpdate()

    const observer = new MutationObserver(schedulePaletteUpdate)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    document.addEventListener('swup:content:replace', schedulePaletteUpdate)

    return () => {
      observer.disconnect()
      document.removeEventListener('swup:content:replace', schedulePaletteUpdate)
    }
  }, [])

  useEffect(() => {
    if (reduceMotion) return

    let cancelled = false
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      if (!cancelled) {
        setReady(true)
      }
    })

    return () => {
      cancelled = true
    }
  }, [reduceMotion])

  useEffect(() => {
    if (typeof window === 'undefined') return

    let raf: number | null = null
    const evaluateDensity = () => {
      raf = null
      const scrollRoom = document.documentElement.scrollHeight - window.innerHeight
      setIsDensePage(scrollRoom > 3600)
    }

    const scheduleEvaluation = () => {
      if (raf) window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(evaluateDensity)
    }

    scheduleEvaluation()
    window.addEventListener('resize', scheduleEvaluation)
    document.addEventListener('swup:content:replace', scheduleEvaluation)

    return () => {
      if (raf) window.cancelAnimationFrame(raf)
      window.removeEventListener('resize', scheduleEvaluation)
      document.removeEventListener('swup:content:replace', scheduleEvaluation)
    }
  }, [])

  const particlesOptions = useMemo<ISourceOptions>(
    () => ({
      background: {
        color: { value: 'transparent' },
      },
      detectRetina: true,
      fullScreen: { enable: false },
      fpsLimit: isDensePage ? 40 : 55,
      particles: {
        color: { value: [tripletToRgb(palette.accent), tripletToRgb(palette.neutral)] },
        number: {
          value: isDensePage ? 18 : 26,
          density: { enable: true, area: isDensePage ? 1400 : 950 },
        },
        move: {
          enable: true,
          speed: isDensePage ? { min: 0.05, max: 0.25 } : { min: 0.08, max: 0.45 },
          outModes: { default: 'out' },
        },
        opacity: {
          value: isDensePage ? { min: 0.08, max: 0.22 } : { min: 0.1, max: 0.28 },
          animation: { enable: true, speed: 0.2, sync: false },
        },
        size: {
          value: isDensePage ? { min: 0.5, max: 2 } : { min: 0.7, max: 2.6 },
          animation: { enable: true, speed: 3, minimumValue: 0.4 },
        },
        links: {
          enable: true,
          color: tripletToRgb(palette.neutral),
          distance: isDensePage ? 110 : 140,
          opacity: isDensePage ? 0.08 : 0.15,
          width: isDensePage ? 0.45 : 0.6,
        },
      },
      interactivity: {
        events: {
          onHover: { enable: true, mode: 'attract' },
          resize: { enable: true, delay: 0.5 },
        },
        modes: { attract: { distance: 140, duration: 0.3, factor: 2 } },
      },
    }),
    [palette, isDensePage],
  )

  const gradientStyle = useMemo(
    () => ({
      backgroundImage: `
        radial-gradient(circle at 12% 20%, ${tripletToRgba(palette.accent, 0.15)} 0%, transparent 55%),
        radial-gradient(circle at 80% 0%, ${tripletToRgba(palette.neutral, 0.12)} 0%, transparent 60%),
        radial-gradient(circle at 50% 100%, ${tripletToRgba(palette.backdrop, 0.2)} 0%, transparent 75%)
      `,
    }),
    [palette],
  )

  return (
    <div
      id="site-animated-background-root"
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{ backgroundColor: tripletToRgb(palette.backdrop) }}
    >
      <div className="absolute inset-0 opacity-80 blur-3xl" style={gradientStyle} />
      {!reduceMotion && ready ? (
        <Particles
          id="site-animated-background"
          className="absolute inset-0"
          style={{ width: '100%', height: '100%' }}
          options={particlesOptions}
        />
      ) : null}
    </div>
  )
}
