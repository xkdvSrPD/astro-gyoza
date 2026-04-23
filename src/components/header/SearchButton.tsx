import { RootPortal } from '@/components/RootPortal'
import { useDebounceValue } from '@/hooks/useDebounceValue'
import { useEffect, useRef, useState, type ReactNode } from 'react'

interface PagefindMatch {
  url: string
  excerpt: string
  meta: {
    title: string
  }
}

interface PagefindModule {
  search: (value: string) => Promise<{
    results: Array<{
      data: () => Promise<PagefindMatch>
    }>
  }>
}

let pagefindPromise: Promise<PagefindModule | null> | undefined

async function loadPagefind() {
  if (import.meta.env.DEV) {
    return null
  }

  if (!pagefindPromise) {
    const url = '/pagefind/pagefind.js'
    pagefindPromise = import(/* @vite-ignore */ url).catch(() => null)
  }

  return pagefindPromise
}

export function SearchButton() {
  const [isOpen, setIsOpen] = useState(false)

  useSearchKeyboardEvents({
    isOpen,
    onOpen: () => setIsOpen(true),
    onClose: () => setIsOpen(false),
  })

  return (
    <>
      <button
        className="size-9 rounded-full border border-primary bg-white/50 shadow-lg shadow-zinc-800/5 backdrop-blur dark:bg-zinc-800/50"
        type="button"
        aria-label="Search"
        onClick={() => setIsOpen(true)}
      >
        <i className="iconfont icon-search"></i>
      </button>
      {isOpen && <SearchDialog onClose={() => setIsOpen(false)} />}
    </>
  )
}

function SearchDialog({ onClose }: { onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [keyword, setKeyword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<PagefindMatch[]>([])
  const debouncedKeyword = useDebounceValue(keyword, 350)

  useBodyScrollLock(true)

  useEffect(() => {
    window.requestAnimationFrame(() => {
      inputRef.current?.focus()
    })
  }, [])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  useEffect(() => {
    let cancelled = false

    async function runSearch(value: string) {
      if (!value) {
        setResults([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      const pagefind = await loadPagefind()

      if (!pagefind || cancelled) {
        setIsLoading(false)
        return
      }

      const response = await pagefind.search(value)

      if (cancelled) {
        return
      }

      const nextResults = await Promise.all(response.results.map((item) => item.data()))

      if (!cancelled) {
        setResults(nextResults)
        setIsLoading(false)
      }
    }

    void runSearch(debouncedKeyword)

    return () => {
      cancelled = true
    }
  }, [debouncedKeyword])

  let resultList: ReactNode = null

  if (import.meta.env.DEV) {
    resultList = (
      <StateView
        title="Search is unavailable in dev"
        description="Pagefind indexes are generated during build."
      />
    )
  } else if (isLoading) {
    resultList = <LoadingView />
  } else if (!keyword) {
    resultList = <StateView title="Start typing to search" />
  } else if (!results.length) {
    resultList = <StateView title="No results" />
  } else {
    resultList = (
      <>
        <div className="mb-2 px-3 text-sm text-secondary">Found {results.length} matches</div>
        {results.map((item) => (
          <a
            href={item.url}
            key={item.url}
            className="block rounded-lg px-3 py-2 transition-colors hover:bg-accent/10"
            onClick={onClose}
          >
            <div className="font-semibold">{item.meta.title}</div>
            <p
              className="text-sm text-secondary"
              dangerouslySetInnerHTML={{ __html: item.excerpt }}
            />
          </a>
        ))}
      </>
    )
  }

  return (
    <RootPortal>
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-sm"
        onClick={onClose}
      >
        <div
          className="flex h-[80vh] max-h-[520px] w-[min(680px,100%)] flex-col rounded-2xl border border-primary bg-primary shadow-2xl shadow-zinc-900/10"
          role="dialog"
          aria-modal="true"
          aria-label="Search"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center gap-3 border-b border-primary px-4 py-3">
            <i className="iconfont icon-search text-secondary"></i>
            <input
              ref={inputRef}
              className="min-w-0 grow bg-transparent outline-none"
              type="text"
              placeholder="Search..."
              maxLength={64}
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
            />
            <button
              className="rounded-full px-2 py-1 text-xs text-secondary transition-colors hover:bg-secondary hover:text-primary"
              type="button"
              onClick={onClose}
            >
              Esc
            </button>
          </div>
          <div className="grow overflow-y-auto px-4 py-3">{resultList}</div>
          <div className="flex justify-end border-t border-primary px-4 py-3 text-xs text-secondary">
            <a href="https://pagefind.app/" target="_blank" rel="noopener noreferrer">
              Powered by Pagefind
            </a>
          </div>
        </div>
      </div>
    </RootPortal>
  )
}

function StateView({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-secondary">
      <div className="text-sm font-medium text-primary">{title}</div>
      {description && <div className="max-w-sm text-sm">{description}</div>}
    </div>
  )
}

function LoadingView() {
  return (
    <div className="flex h-full items-center justify-center">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="2em"
        viewBox="0 0 24 24"
        className="animate-spin text-secondary"
      >
        <path
          fill="currentColor"
          d="M12 2a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1m0 15a1 1 0 0 1 1 1v3a1 1 0 1 1-2 0v-3a1 1 0 0 1 1-1m8.66-10a1 1 0 0 1-.366 1.366l-2.598 1.5a1 1 0 1 1-1-1.732l2.598-1.5A1 1 0 0 1 20.66 7M7.67 14.5a1 1 0 0 1-.367 1.366l-2.598 1.5a1 1 0 1 1-1-1.732l2.598-1.5a1 1 0 0 1 1.366.366M20.66 17a1 1 0 0 1-1.366.366l-2.598-1.5a1 1 0 0 1 1-1.732l2.598 1.5A1 1 0 0 1 20.66 17M7.67 9.5a1 1 0 0 1-1.367.366l-2.598-1.5a1 1 0 1 1 1-1.732l2.598 1.5A1 1 0 0 1 7.67 9.5"
        />
      </svg>
    </div>
  )
}

function useSearchKeyboardEvents({
  isOpen,
  onOpen,
  onClose,
}: {
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()

        if (isOpen) {
          onClose()
        } else {
          onOpen()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, onOpen])
}

function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) {
      return
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [active])
}
