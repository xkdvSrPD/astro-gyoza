import { useEffect, useState } from 'react'
import GiscusComponent from '@giscus/react'
import type { Theme } from '@giscus/react'
import '@/styles/giscus.css'

interface GiscusProps {
  repo: string
  repoId: string
  category: string
  categoryId: string
  mapping: string
  strict: string
  reactionsEnabled: string
  emitMetadata: string
  inputPosition: string
  theme: string
  lang: string
  loading: string
}

export function Giscus({
  repo,
  repoId,
  category,
  categoryId,
  mapping,
  strict,
  reactionsEnabled,
  emitMetadata,
  inputPosition,
  theme: defaultTheme,
  lang,
  loading,
}: GiscusProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    // 检查当前主题
    if (typeof window !== 'undefined') {
      const currentTheme = document.documentElement.getAttribute('data-theme')
      return currentTheme === 'dark' ? 'transparent_dark' : 'light'
    }
    return 'light'
  })

  useEffect(() => {
    // 监听主题变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
          const newTheme = document.documentElement.getAttribute('data-theme')
          setTheme(newTheme === 'dark' ? 'transparent_dark' : 'light')
        }
      })
    })

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  return (
    <div className="giscus-container">
      <GiscusComponent
        repo={repo as `${string}/${string}`}
        repoId={repoId}
        category={category}
        categoryId={categoryId}
        mapping={mapping as any}
        strict={strict as '0' | '1'}
        reactionsEnabled={reactionsEnabled as '0' | '1'}
        emitMetadata={emitMetadata as '0' | '1'}
        inputPosition={inputPosition as any}
        theme={theme}
        lang={lang}
        loading={loading as any}
      />
    </div>
  )
}