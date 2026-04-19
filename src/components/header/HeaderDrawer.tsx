import { menus } from '@/config.json'
import { createContext, useContext, useState, forwardRef } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import clsx from 'clsx'

export function HeaderDrawer({ zIndex = 999 }: { zIndex?: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const overlayZIndex = zIndex - 1
  const contentZIndex = zIndex

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <TriggerButton />
      </Dialog.Trigger>

      <Dialog.Portal forceMount>
        <Dialog.Overlay
          forceMount
          className="fixed inset-0 bg-gray-800/30 transition-opacity duration-150 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=open]:opacity-100"
          style={{ zIndex: overlayZIndex }}
        />

        <Dialog.Content
          forceMount
          className="fixed left-0 inset-y-0 h-full w-[260px] max-w-[80%] rounded-r-lg bg-primary p-4 flex flex-col justify-center transition-all duration-150 data-[state=closed]:-translate-x-4 data-[state=closed]:pointer-events-none data-[state=closed]:opacity-0 data-[state=open]:translate-x-0 data-[state=open]:opacity-100"
          style={{ zIndex: contentZIndex }}
        >
          <DrawerContext.Provider
            value={{
              dismiss() {
                setIsOpen(false)
              },
            }}
          >
            <DrawerContentImpl />
          </DrawerContext.Provider>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const TriggerButton = forwardRef<HTMLButtonElement>((props, ref) => {
  return (
    <button
      ref={ref}
      className="size-9 rounded-full shadow-lg shadow-zinc-800/5 border border-primary bg-white/50 dark:bg-zinc-800/50 backdrop-blur"
      type="button"
      aria-label="Open menu"
      {...props}
    >
      <i className="iconfont icon-menu"></i>
    </button>
  )
})

function DrawerContentImpl() {
  const { dismiss } = useContext(DrawerContext)

  return (
    <ul className="mt-8 pb-8 overflow-y-auto overflow-x-hidden min-h-0">
      {menus.map((menu) => (
        <li key={menu.name}>
          <a className="inline-flex p-2 space-x-4" href={menu.link} onClick={dismiss}>
            <i className={clsx('iconfont', menu.icon)}></i>
            <span>{menu.name}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

const DrawerContext = createContext<{ dismiss(): void }>(null!)
