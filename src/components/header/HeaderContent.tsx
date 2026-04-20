import { menus } from '@/config.json'
import { clsx } from 'clsx'
import {
  useCurrentPathname,
  useShouldAccessibleMenuShow,
  useShouldHeaderMenuBgShow,
  useShouldHeaderMetaShow,
} from './hooks'
import { RootPortal } from '@/components/RootPortal'

export function HeaderContent() {
  return (
    <>
      <AnimatedMenu />
      <AccessibleMenu />
    </>
  )
}

function AnimatedMenu() {
  const shouldBgShow = useShouldHeaderMenuBgShow()
  const shouldHeaderMetaShow = useShouldHeaderMetaShow()

  return (
    <div
      className={`transition-all duration-150 ${
        shouldHeaderMetaShow
          ? 'pointer-events-none translate-y-1 opacity-0'
          : 'translate-y-0 opacity-100'
      }`}
    >
      <HeaderMenu isBgShow={shouldBgShow} />
    </div>
  )
}

function AccessibleMenu() {
  const shouldShow = useShouldAccessibleMenuShow()

  return (
    <RootPortal>
      <div
        className={`fixed inset-x-0 top-16 z-10 flex -translate-y-1/2 justify-center transition-all duration-150 ${
          shouldShow ? 'opacity-100' : 'pointer-events-none -translate-y-[calc(50%+8px)] opacity-0'
        }`}
      >
        <HeaderMenu isBgShow />
      </div>
    </RootPortal>
  )
}

function HeaderMenu({ isBgShow }: { isBgShow: boolean }) {
  const pathName = useCurrentPathname()

  return (
    <nav
      className={clsx('relative rounded-full group pointer-events-auto duration-200', {
        'bg-gradient-to-b from-zinc-50/70 to-white/90 shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 backdrop-blur-md dark:from-zinc-900/70 dark:to-zinc-800/90 dark:ring-zinc-100/10':
          isBgShow,
      })}
    >
      <div className="flex items-center px-4 text-sm">
        {menus.map((menu) => (
          <HeaderMenuItem
            key={menu.name}
            href={menu.link}
            title={menu.name}
            icon={menu.icon}
            isActive={pathName === menu.link}
          />
        ))}
      </div>
    </nav>
  )
}

function HeaderMenuItem({
  href,
  isActive,
  title,
  icon,
}: {
  href: string
  isActive: boolean
  title: string
  icon: string
}) {
  return (
    <a
      className={clsx(
        'relative flex h-10 items-center px-4 leading-none',
        isActive ? 'text-accent' : 'hover:text-accent',
      )}
      href={href}
    >
      <div className="flex h-full items-center space-x-2">
        {isActive && <i className={clsx('iconfont inline-flex items-center leading-none', icon)}></i>}
        <span className="leading-none">{title}</span>
      </div>
      {isActive && (
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent"></div>
      )}
    </a>
  )
}
