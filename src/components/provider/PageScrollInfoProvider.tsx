import { useLayoutEffect, useRef } from 'react'
import { useSetAtom } from 'jotai'
import { pageScrollLocationAtom, pageScrollDirectionAtom } from '@/store/scrollInfo'

export function PageScrollInfoProvider() {
  const setScrollLocation = useSetAtom(pageScrollLocationAtom)
  const setScrollDirection = useSetAtom(pageScrollDirectionAtom)
  const prevScrollY = useRef(0)
  const frameRef = useRef<number | null>(null)

  useLayoutEffect(() => {
    const syncScrollInfo = () => {
      let currentTop = document.documentElement.scrollTop

      if (currentTop === 0) {
        const bodyStyle = document.body.style
        if (bodyStyle.position === 'fixed') {
          const bodyTop = bodyStyle.top
          currentTop = Math.abs(parseInt(bodyTop, 10))
        }
      }

      setScrollDirection(prevScrollY.current - currentTop > 0 ? 'up' : 'down')
      prevScrollY.current = currentTop
      setScrollLocation(currentTop)
      frameRef.current = null
    }

    const handleScroll = () => {
      if (frameRef.current !== null) {
        return
      }

      frameRef.current = window.requestAnimationFrame(syncScrollInfo)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return null
}
