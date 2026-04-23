import { emitToast } from '@/utils/toast'

type QrCodeModule = typeof import('qrcode')

interface BootstrapState {
  initialized: boolean
  scrollFrameId: number
  shareModal: HTMLElement | null
  sharePreviousOverflow: string
  qrcodePromise?: Promise<QrCodeModule>
  giscusObserver?: IntersectionObserver
}

const bootstrapWindow = window as Window & {
  __widgetBootstrapState?: BootstrapState
}

const bootstrapState =
  bootstrapWindow.__widgetBootstrapState ??
  (bootstrapWindow.__widgetBootstrapState = {
    initialized: false,
    scrollFrameId: 0,
    shareModal: null,
    sharePreviousOverflow: '',
  })

const HEADING_OFFSET = 80

function closeShareModal() {
  if (!bootstrapState.shareModal) {
    return
  }

  bootstrapState.shareModal.classList.add('hidden')
  bootstrapState.shareModal.setAttribute('aria-hidden', 'true')
  document.body.style.overflow = bootstrapState.sharePreviousOverflow
  bootstrapState.shareModal = null
}

async function copyText(
  text: string,
  successMessage = 'Link copied',
  errorMessage = 'Copy failed',
) {
  if (!text) {
    emitToast(errorMessage, 'error')
    return
  }

  try {
    await navigator.clipboard.writeText(text)
    emitToast(successMessage)
  } catch {
    emitToast(errorMessage, 'error')
  }
}

async function loadQrCode() {
  if (!bootstrapState.qrcodePromise) {
    bootstrapState.qrcodePromise = import('qrcode')
  }

  return bootstrapState.qrcodePromise
}

async function ensureShareQr(root: HTMLElement) {
  const image = root.querySelector<HTMLImageElement>('[data-share-qr-image]')
  const loading = root.querySelector<HTMLElement>('[data-share-qr-loading]')
  const url = root.dataset.shareUrl

  if (!image || !loading || !url || image.dataset.loaded === 'true') {
    return
  }

  loading.hidden = false

  try {
    const qrcode = await loadQrCode()
    image.src = await qrcode.toDataURL(url, {
      margin: 0,
      width: 156,
    })
    image.dataset.loaded = 'true'
    image.hidden = false
    loading.hidden = true
  } catch {
    loading.textContent = 'QR code unavailable'
  }
}

function openShareModal(root: HTMLElement) {
  const modal = root.querySelector<HTMLElement>('[data-share-modal]')
  if (!modal) {
    return
  }

  closeShareModal()

  bootstrapState.sharePreviousOverflow = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  bootstrapState.shareModal = modal
  modal.classList.remove('hidden')
  modal.setAttribute('aria-hidden', 'false')

  void ensureShareQr(root)
}

function updateOutdateBanners() {
  const banners = Array.from(document.querySelectorAll<HTMLElement>('[data-outdate]'))

  banners.forEach((banner) => {
    const lastMod = banner.dataset.lastMod
    if (!lastMod) {
      return
    }

    const diffDays = Math.floor((Date.now() - new Date(lastMod).getTime()) / 86400000)
    banner.classList.toggle('hidden', diffDays <= 30)
  })
}

function updateTimelineProgress() {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-timeline-progress]'))
  if (!roots.length) {
    return
  }

  const now = new Date()
  const yearStart = new Date(now.getFullYear(), 0, 1)
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const dayOfYear = Math.floor((now.getTime() - yearStart.getTime()) / 86400000)
  const isLeapYear =
    (now.getFullYear() % 4 === 0 && now.getFullYear() % 100 !== 0) || now.getFullYear() % 400 === 0
  const daysInYear = isLeapYear ? 366 : 365
  const yearProgress = ((dayOfYear / daysInYear) * 100).toFixed(5)
  const dayProgress = (((now.getTime() - dayStart.getTime()) / 86400000) * 100).toFixed(5)

  roots.forEach((root) => {
    const yearNode = root.querySelector<HTMLElement>('[data-timeline-year]')
    const dayNode = root.querySelector<HTMLElement>('[data-timeline-day]')
    const yearProgressNode = root.querySelector<HTMLElement>('[data-timeline-year-progress]')
    const dayProgressNode = root.querySelector<HTMLElement>('[data-timeline-day-progress]')

    if (yearNode) {
      yearNode.textContent = String(now.getFullYear())
    }
    if (dayNode) {
      dayNode.textContent = String(dayOfYear)
    }
    if (yearProgressNode) {
      yearProgressNode.textContent = yearProgress
    }
    if (dayProgressNode) {
      dayProgressNode.textContent = dayProgress
    }
  })
}

function updateReadingProgress() {
  const article = document.querySelector<HTMLElement>('#markdown-wrapper')
  const progressNodes = Array.from(
    document.querySelectorAll<HTMLElement>('[data-reading-progress-value]'),
  )

  if (!progressNodes.length) {
    return
  }

  if (!article) {
    progressNodes.forEach((node) => {
      node.textContent = '0'
    })
    return
  }

  const fullHeight = article.offsetHeight + article.offsetTop - window.innerHeight
  const percent =
    fullHeight <= 0
      ? 100
      : Math.max(0, Math.min(100, Math.floor((window.scrollY / fullHeight) * 100)))

  progressNodes.forEach((node) => {
    node.textContent = String(percent)
  })
}

function updatePostToc() {
  const article = document.querySelector<HTMLElement>('#markdown-wrapper')
  const tocRoots = Array.from(document.querySelectorAll<HTMLElement>('[data-post-toc]'))

  if (!tocRoots.length || !article) {
    return
  }

  const headings = Array.from(article.querySelectorAll<HTMLElement>('h1, h2, h3, h4, h5, h6'))
  let activeId = ''

  for (let index = 0; index < headings.length; index += 1) {
    const current = headings[index]
    const next = headings[index + 1]
    const currentTop = current.getBoundingClientRect().top
    const nextTop = next?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY

    if (currentTop <= HEADING_OFFSET && nextTop > HEADING_OFFSET) {
      activeId = current.id
      break
    }
  }

  tocRoots.forEach((root) => {
    const container = root.querySelector<HTMLElement>('[data-post-toc-scroll]')
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-toc-item]'))

    items.forEach((item) => {
      const slug = item.dataset.headingSlug ?? ''
      const isActive = slug === activeId
      const indicator = item.querySelector<HTMLElement>('[data-toc-indicator]')
      const link = item.querySelector<HTMLElement>('[data-toc-link]')

      indicator?.classList.toggle('bg-accent', isActive)
      indicator?.classList.toggle('bg-zinc-300', !isActive)
      indicator?.classList.toggle('dark:bg-zinc-700', !isActive)

      if (link) {
        link.classList.toggle('opacity-100', isActive)
        link.classList.toggle('opacity-0', !isActive)
        link.classList.toggle('text-zinc-500', !isActive)
        link.classList.toggle('hover:text-zinc-900', !isActive)
        link.classList.toggle('dark:hover:text-zinc-100', !isActive)
      }

      if (isActive && container) {
        const itemTop = item.offsetTop - container.scrollTop
        const itemBottom = itemTop + item.clientHeight

        if (itemTop < 0 || itemBottom > container.clientHeight) {
          container.scrollTop = item.offsetTop - container.clientHeight + item.clientHeight
        }
      }
    })
  })
}

function scheduleScrollWidgetsUpdate() {
  if (bootstrapState.scrollFrameId) {
    return
  }

  bootstrapState.scrollFrameId = window.requestAnimationFrame(() => {
    bootstrapState.scrollFrameId = 0
    updateReadingProgress()
    updatePostToc()
  })
}

function getGiscusTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
    ? 'transparent_dark'
    : 'light'
}

function syncGiscusTheme() {
  const iframe = document.querySelector<HTMLIFrameElement>('iframe.giscus-frame')
  iframe?.contentWindow?.postMessage(
    {
      giscus: {
        setConfig: {
          theme: getGiscusTheme(),
        },
      },
    },
    'https://giscus.app',
  )
}

function mountGiscus(root: HTMLElement) {
  if (root.dataset.giscusMounted === 'true' || window.location.hostname.includes('vio.vin')) {
    return
  }

  root.dataset.giscusMounted = 'true'
  root.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'

  const attributeMap = {
    repo: root.dataset.repo,
    repoId: root.dataset.repoId,
    category: root.dataset.category,
    categoryId: root.dataset.categoryId,
    mapping: root.dataset.mapping,
    strict: root.dataset.strict,
    reactionsEnabled: root.dataset.reactionsEnabled,
    emitMetadata: root.dataset.emitMetadata,
    inputPosition: root.dataset.inputPosition,
    lang: root.dataset.lang,
    loading: root.dataset.loading,
  }

  Object.entries(attributeMap).forEach(([key, value]) => {
    if (value) {
      script.setAttribute(key, value)
    }
  })

  script.setAttribute('theme', getGiscusTheme())
  root.appendChild(script)
}

function registerGiscusRoots() {
  const roots = Array.from(document.querySelectorAll<HTMLElement>('[data-giscus-root]'))

  roots.forEach((root) => {
    if (window.location.hostname.includes('vio.vin')) {
      root.innerHTML = ''
      return
    }

    if (root.dataset.giscusObserved === 'true') {
      return
    }

    root.dataset.giscusObserved = 'true'

    if (bootstrapState.giscusObserver) {
      bootstrapState.giscusObserver.observe(root)
      return
    }

    mountGiscus(root)
  })
}

function updateFlashlightVisibility() {
  const flashlight = document.querySelector<HTMLElement>('[data-flashlight]')
  if (!flashlight) {
    return
  }

  const shouldShow = window.matchMedia('(hover: hover)').matches
  flashlight.classList.toggle('hidden', !shouldShow)
}

function handleFlashlightMove(event: MouseEvent) {
  const flashlight = document.querySelector<HTMLElement>('[data-flashlight]')
  if (!flashlight || flashlight.classList.contains('hidden')) {
    return
  }

  flashlight.style.backgroundImage = `radial-gradient(circle 16vmax at ${event.clientX}px ${event.clientY}px, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 80%, rgba(0, 0, 0, 0.8) 100%)`
}

function initializePageWidgets() {
  closeShareModal()
  updateOutdateBanners()
  updateTimelineProgress()
  updateFlashlightVisibility()
  registerGiscusRoots()
  scheduleScrollWidgetsUpdate()
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target as Element | null
  if (!target) {
    return
  }

  const copyButton = target.closest<HTMLElement>('[data-copy-text]')
  if (copyButton) {
    event.preventDefault()
    void copyText(
      copyButton.dataset.copyText ?? '',
      copyButton.dataset.copySuccess ?? 'Link copied',
      copyButton.dataset.copyError ?? 'Copy failed',
    )
    return
  }

  const shareOpenButton = target.closest<HTMLElement>('[data-share-open]')
  if (shareOpenButton) {
    event.preventDefault()
    const shareRoot = shareOpenButton.closest<HTMLElement>('[data-share-root]')
    if (shareRoot) {
      openShareModal(shareRoot)
    }
    return
  }

  const shareCloseButton = target.closest<HTMLElement>('[data-share-close]')
  if (shareCloseButton) {
    event.preventDefault()
    closeShareModal()
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeShareModal()
  }
}

function initializeBootstrap() {
  if (bootstrapState.initialized) {
    return
  }

  bootstrapState.initialized = true

  if ('IntersectionObserver' in window) {
    bootstrapState.giscusObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            bootstrapState.giscusObserver?.unobserve(entry.target)
            mountGiscus(entry.target as HTMLElement)
          }
        })
      },
      {
        rootMargin: '200px 0px',
      },
    )
  }

  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('swup:content:replace', initializePageWidgets)
  document.addEventListener('app-theme-change', syncGiscusTheme as EventListener)
  window.addEventListener('scroll', scheduleScrollWidgetsUpdate, { passive: true })
  window.addEventListener('resize', scheduleScrollWidgetsUpdate, { passive: true })
  document.addEventListener('mousemove', handleFlashlightMove)

  window.setInterval(updateTimelineProgress, 1000)
  initializePageWidgets()
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeBootstrap, { once: true })
} else {
  initializeBootstrap()
}
