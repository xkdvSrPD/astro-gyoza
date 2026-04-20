import { useSetAtom } from 'jotai'
import { useEffect } from 'react'
import { pathNameAtom, metaTitleAtom, metaDescriptionAtom, metaSlugAtom } from '@/store/metaInfo'

function normalizePathname(pathname: string) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function HeaderMetaInfoProvider({
  pathName,
  title = '',
  description = '',
  slug = '',
}: {
  pathName: string
  title?: string
  description?: string
  slug?: string
}) {
  const setPathName = useSetAtom(pathNameAtom)
  const setTitle = useSetAtom(metaTitleAtom)
  const setDescription = useSetAtom(metaDescriptionAtom)
  const setSlug = useSetAtom(metaSlugAtom)

  function syncMetaFromPage() {
    const metaRoot = document.querySelector<HTMLElement>('[data-header-meta]')
    const nextPathname = normalizePathname(window.location.pathname)

    setPathName(nextPathname)
    setTitle(metaRoot?.dataset.title ?? '')
    setDescription(metaRoot?.dataset.description ?? '')
    setSlug(metaRoot?.dataset.slug ?? '')
  }

  useEffect(() => {
    setPathName(normalizePathname(pathName))
    setTitle(title)
    setDescription(description)
    setSlug(slug)
  }, [pathName, title, description, slug])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const sync = () => {
      syncMetaFromPage()
    }

    sync()
    window.addEventListener('popstate', sync)
    document.addEventListener('swup:content:replace', sync)

    return () => {
      window.removeEventListener('popstate', sync)
      document.removeEventListener('swup:content:replace', sync)
    }
  }, [])

  return null
}
