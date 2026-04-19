import { site } from '@/config.json'
import { useHeaderMetaInfo, useShouldHeaderMetaShow } from './hooks'

export function HeaderMeta() {
  const { title, description, slug } = useHeaderMetaInfo()
  const shouldShow = useShouldHeaderMetaShow()

  return (
    <div
      className={`absolute inset-0 z-1 flex items-center justify-between pointer-events-none md:px-5 transition-all duration-150 ${
        shouldShow ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <div className="grow min-w-0">
        <div className="text-secondary text-xs truncate">{description}</div>
        <h2 className="truncate text-lg">{title}</h2>
      </div>
      <div className="hidden md:block min-w-0 text-right">
        <div className="text-secondary text-xs truncate">{slug}</div>
        <div>{site.title}</div>
      </div>
    </div>
  )
}
