import { useEffect, useRef, useState } from 'react'
import { getDaysInYear, getDiffInDays, getStartOfDay, getStartOfYear } from '@/utils/date'

export function TimelineProgress() {
  const [currentYear, setCurrentYear] = useState(0)
  const [dayOfYear, setDayOfYear] = useState(0)
  const [percentOfYear, setPercentOfYear] = useState(0)
  const [percentOfToday, setPercentOfToday] = useState(0)

  useEffect(() => {
    const updateInfo = () => {
      const now = new Date()
      setCurrentYear(now.getFullYear())

      const pastDays = getDiffInDays(getStartOfYear(now), now)
      setDayOfYear(pastDays)
      setPercentOfYear((pastDays / getDaysInYear(now)) * 100)

      const pastTime = now.getTime() - getStartOfDay(now).getTime()
      setPercentOfToday((pastTime / 86400 / 1000) * 100)
    }

    updateInfo()
    const interval = window.setInterval(updateInfo, 1000)

    return () => {
      window.clearInterval(interval)
    }
  }, [])

  return (
    <>
      <p className="mt-4">
        Day <CountUp to={dayOfYear} decimals={0} duration={0.5} /> of {currentYear}
      </p>
      <p className="mt-4">
        Year progress <CountUp to={percentOfYear} decimals={5} />%
      </p>
      <p className="mt-4">
        Today progress <CountUp to={percentOfToday} decimals={5} />%
      </p>
    </>
  )
}

function CountUp({
  to,
  decimals,
  duration = 1,
}: {
  to: number
  decimals: number
  duration?: number
}) {
  const node = useRef<HTMLSpanElement>(null)
  const prevValue = useRef(0)

  useEffect(() => {
    const target = node.current
    if (!target) {
      return
    }

    const startValue = prevValue.current
    const durationMs = Math.max(duration * 1000, 1)
    let frameId = 0
    const startedAt = performance.now()

    const renderValue = (value: number) => {
      target.textContent = value.toFixed(decimals)
    }

    const tick = (now: number) => {
      const progress = Math.min((now - startedAt) / durationMs, 1)
      const easedProgress = 1 - Math.pow(1 - progress, 3)
      const currentValue = startValue + (to - startValue) * easedProgress

      renderValue(currentValue)

      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    renderValue(startValue)
    frameId = window.requestAnimationFrame(tick)
    prevValue.current = to

    return () => {
      window.cancelAnimationFrame(frameId)
    }
  }, [decimals, duration, to])

  return <span ref={node}></span>
}
