import { RootPortal } from '@/components/RootPortal'
import { metaSlugAtom, metaTitleAtom } from '@/store/metaInfo'
import { emitToast } from '@/utils/toast'
import { site } from '@/config.json'
import { useAtomValue } from 'jotai'
import { useEffect, useState, type ComponentType } from 'react'

type QRCodeSVGComponent = ComponentType<{
  value: string
  size: number
}>

export function ActionAside() {
  return (
    <div
      className="absolute bottom-0 left-0 flex flex-col gap-4"
      style={{
        transform: 'translateY(calc(100% + 24px))',
      }}
    >
      <ShareButton />
    </div>
  )
}

function ShareButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [qrCode, setQrCode] = useState<{ Component: QRCodeSVGComponent } | null>(null)
  const postSlug = useAtomValue(metaSlugAtom)
  const postTitle = useAtomValue(metaTitleAtom)
  const url = new URL(postSlug, site.url).href

  useEffect(() => {
    if (!isOpen || qrCode) {
      return
    }

    let cancelled = false

    void import('qrcode.react').then((module) => {
      if (!cancelled) {
        setQrCode({
          Component: module.QRCodeSVG as QRCodeSVGComponent,
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [isOpen, qrCode])

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url)
      emitToast('Link copied')
    } catch {
      emitToast('Copy failed', 'error')
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Share this post"
        className="size-6 text-xl leading-none hover:text-accent"
        onClick={() => setIsOpen(true)}
      >
        <i className="iconfont icon-share"></i>
      </button>
      {isOpen && (
        <RootPortal>
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center bg-zinc-950/35 px-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="w-[min(420px,100%)] rounded-2xl border border-primary bg-primary p-4 shadow-2xl shadow-zinc-900/10"
              role="dialog"
              aria-modal="true"
              aria-label="Share"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-semibold">Share this post</h2>
                  <p className="mt-1 text-sm text-secondary">
                    {postTitle || 'Post link and QR code'}
                  </p>
                </div>
                <button
                  className="rounded-full px-2 py-1 text-xs text-secondary transition-colors hover:bg-secondary hover:text-primary"
                  type="button"
                  onClick={() => setIsOpen(false)}
                >
                  Esc
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
                <div className="flex h-[180px] items-center justify-center rounded-2xl border border-primary bg-white p-3">
                  {qrCode ? (
                    <qrCode.Component value={url} size={156} />
                  ) : (
                    <span className="text-sm text-secondary">Loading QR code...</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-col gap-3">
                  <div className="break-all rounded-2xl border border-primary bg-secondary/50 p-3 text-sm text-secondary">
                    {url}
                  </div>
                  <button
                    type="button"
                    className="rounded-2xl border border-primary px-4 py-2 text-sm transition-colors hover:bg-secondary"
                    onClick={() => void handleCopyLink()}
                  >
                    Copy link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </RootPortal>
      )}
    </>
  )
}
