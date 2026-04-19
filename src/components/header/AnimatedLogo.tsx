import { useShouldHeaderMetaShow, useIsMobile } from './hooks'
import { site } from '@/config.json'

export function AnimatedLogo() {
  const isMobile = useIsMobile()
  const shouldHeaderMetaShow = useShouldHeaderMetaShow()

  if (!isMobile) {
    return <Logo />
  }

  return (
    <div
      className={`transition-all duration-150 ${
        shouldHeaderMetaShow
          ? 'pointer-events-none translate-y-1 opacity-0'
          : 'translate-y-0 opacity-100'
      }`}
    >
      <Logo />
    </div>
  )
}

function Logo() {
  return (
    <a className="block" href="/" title="Nav to home">
      <img
        className="size-[40px] select-none object-cover rounded-2xl"
        src={site.favicon}
        alt="Site owner avatar"
      />
    </a>
  )
}
