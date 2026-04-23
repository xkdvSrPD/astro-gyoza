import { useAtomValue } from 'jotai'
import { useEffect, useState } from 'react'
import {
  pathNameAtom,
  metaTitleAtom,
  metaDescriptionAtom,
  metaSlugAtom,
  hasMetaInfoAtom,
} from '@/store/metaInfo'
import { pageScrollLocationAtom, pageScrollDirectionAtom } from '@/store/scrollInfo'
import { isMobileAtom } from '@/store/viewport'

const threshold = 60

function floorWithPrecision(value: number, precision = 0) {
  const factor = 10 ** precision
  return Math.floor(value * factor) / factor
}

export function useHeaderBgOpacity() {
  const scrollY = useAtomValue(pageScrollLocationAtom)
  if (scrollY >= threshold * 2) {
    return 1
  } else if (scrollY <= threshold) {
    return 0
  } else {
    return floorWithPrecision((scrollY - threshold) / threshold, 2)
  }
}

export function useHasMetaInfo() {
  return useAtomValue(hasMetaInfoAtom)
}

export function useShouldHeaderMenuBgShow() {
  const scrollY = useAtomValue(pageScrollLocationAtom)
  return scrollY < threshold
}

export function useIsMobile() {
  return useAtomValue(isMobileAtom)
}

export function useShouldHeaderMetaShow() {
  const hasMetaInfo = useHasMetaInfo()
  const scrollY = useAtomValue(pageScrollLocationAtom)

  return hasMetaInfo && scrollY >= threshold
}

export function useHeaderMetaInfo() {
  const title = useAtomValue(metaTitleAtom)
  const description = useAtomValue(metaDescriptionAtom)
  const slug = useAtomValue(metaSlugAtom)

  return {
    title,
    description,
    slug,
  }
}

export function usePathName() {
  return useAtomValue(pathNameAtom)
}

function normalizePathname(pathname: string) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function useCurrentPathname() {
  const [pathname, setPathname] = useState(() => {
    if (typeof window === 'undefined') return ''
    return normalizePathname(window.location.pathname)
  })

  useEffect(() => {
    const syncPathname = () => {
      setPathname(normalizePathname(window.location.pathname))
    }

    syncPathname()
    window.addEventListener('popstate', syncPathname)
    document.addEventListener('swup:content:replace', syncPathname)

    return () => {
      window.removeEventListener('popstate', syncPathname)
      document.removeEventListener('swup:content:replace', syncPathname)
    }
  }, [])

  return pathname
}

export function useShouldAccessibleMenuShow() {
  const scrollY = useAtomValue(pageScrollLocationAtom)
  const scrollDirection = useAtomValue(pageScrollDirectionAtom)
  const hasMetaInfo = useHasMetaInfo()

  return hasMetaInfo && scrollY >= 400 && scrollDirection === 'up'
}
