import { pageScrollLocationAtom, pageScrollDirectionAtom } from '@/store/scrollInfo'
import type { MarkdownHeading } from 'astro'
import clsx from 'clsx'
import { useAtomValue } from 'jotai'
import { startTransition, useEffect, useRef, useState } from 'react'

const HEADING_OFFSET = 80 // Offset for determining active heading
const TOC_MAX_HEIGHT = 'min(380px, calc(100vh - 250px))'

/**
 * Hook to track the currently active heading based on scroll position
 */
function useActiveHeading() {
  const [activeId, setActiveId] = useState('')
  const scrollY = useAtomValue(pageScrollLocationAtom)

  useEffect(() => {
    const article = document.querySelector('#markdown-wrapper')
    if (!article) return

    const headings = Array.from(article.querySelectorAll('h1, h2, h3, h4, h5, h6'))

    // Find the active heading by checking which one is currently at the top
    for (let i = 0; i < headings.length; i++) {
      const current = headings[i]
      const next = headings[i + 1]

      const currentTop = current.getBoundingClientRect().top
      const nextTop = next?.getBoundingClientRect().top ?? Infinity

      if (currentTop <= HEADING_OFFSET && nextTop > HEADING_OFFSET) {
        startTransition(() => {
          setActiveId(current.id)
        })
        break
      }
    }
  }, [scrollY])

  return activeId
}

/**
 * Hook to auto-scroll the TOC container to keep the active item visible
 */
function useAutoScroll(isActive: boolean, containerRef: React.RefObject<HTMLElement | null>) {
  const scrollDirection = useAtomValue(pageScrollDirectionAtom)

  useEffect(() => {
    if (!isActive || !containerRef.current) return

    const container = containerRef.current.parentElement
    if (!container) return

    const { clientHeight: containerHeight } = container
    const { clientHeight: itemHeight, offsetTop: itemOffsetTop } = containerRef.current
    const { scrollTop } = container

    const itemTop = itemOffsetTop - scrollTop
    const itemBottom = itemTop + itemHeight

    // Scroll only if the item is out of view
    if (itemTop < 0 || itemBottom > containerHeight) {
      container.scrollTop = scrollDirection === 'up'
        ? itemOffsetTop - containerHeight + itemHeight
        : itemOffsetTop
    }
  }, [isActive, scrollDirection])
}

interface TocItemProps {
  slug: string
  text: string
  depth: number
  isActive: boolean
}

function TocItem({ slug, text, depth, isActive }: TocItemProps) {
  const itemRef = useRef<HTMLLIElement>(null)
  useAutoScroll(isActive, itemRef)

  const indicatorWidth = 4 * (7 - depth)

  return (
    <li className="relative" ref={itemRef}>
      <span
        className={clsx(
          'absolute left-0 top-2 h-1 rounded-full transition-colors',
          isActive ? 'bg-accent' : 'bg-zinc-300 dark:bg-zinc-700',
        )}
        style={{ width: `${indicatorWidth}px` }}
        aria-hidden="true"
      />
      <a
        className={clsx(
          'inline-block pl-8 transition-opacity duration-300',
          isActive
            ? 'opacity-100'
            : 'opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
        )}
        href={`#${slug}`}
      >
        {text}
      </a>
    </li>
  )
}

interface PostTocProps {
  headings: MarkdownHeading[]
}

export function PostToc({ headings }: PostTocProps) {
  const activeId = useActiveHeading()

  return (
    <nav aria-label="Table of contents">
      <ul
        className="relative overflow-y-auto space-y-2 group text-sm"
        style={{
          maxHeight: TOC_MAX_HEIGHT,
          scrollbarWidth: 'none',
        }}
      >
        {headings.map((heading) => (
          <TocItem
            key={heading.slug}
            slug={heading.slug}
            text={heading.text}
            depth={heading.depth}
            isActive={heading.slug === activeId}
          />
        ))}
      </ul>
    </nav>
  )
}
