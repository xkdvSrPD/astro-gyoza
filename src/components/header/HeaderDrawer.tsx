import { RootPortal } from '@/components/RootPortal'
import { menus } from '@/config.json'
import clsx from 'clsx'
import { useEffect, useState } from 'react'

export function HeaderDrawer({ zIndex = 999 }: { zIndex?: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const overlayZIndex = zIndex - 1
  const contentZIndex = zIndex

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  return (
    <>
      <button
        className="size-9 rounded-full border border-primary bg-white/50 shadow-lg shadow-zinc-800/5 backdrop-blur dark:bg-zinc-800/50"
        type="button"
        aria-label="Open menu"
        onClick={() => setIsOpen(true)}
      >
        <i className="iconfont icon-menu"></i>
      </button>

      {isOpen && (
        <RootPortal>
          <div
            className="fixed inset-0 bg-gray-800/30"
            style={{ zIndex: overlayZIndex }}
            onClick={() => setIsOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 flex h-full w-[260px] max-w-[80%] flex-col justify-center rounded-r-lg bg-primary p-4 shadow-2xl shadow-zinc-900/10"
            style={{ zIndex: contentZIndex }}
          >
            <ul className="mt-8 min-h-0 overflow-x-hidden overflow-y-auto pb-8">
              {menus.map((menu) => (
                <li key={menu.name}>
                  <a
                    className="inline-flex items-center space-x-4 rounded-lg p-2 hover:bg-secondary/70"
                    href={menu.link}
                    onClick={() => setIsOpen(false)}
                  >
                    <i className={clsx('iconfont', menu.icon)}></i>
                    <span>{menu.name}</span>
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        </RootPortal>
      )}
    </>
  )
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
