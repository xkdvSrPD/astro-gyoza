const root = document.documentElement

const decode = (hex, key) => {
  let result = ''
  for (let i = 0; i < hex.length; i += 4) {
    result += String.fromCharCode(
      parseInt(hex.substring(i, i + 4), 16) ^ key.charCodeAt((i / 4) % key.length),
    )
  }
  return result
}

const domainMarker = decode('00110010000000540017000e0017', 'gyoza')

const setPressed = (selector, attr, value) => {
  document.querySelectorAll(selector).forEach((button) => {
    button.setAttribute('aria-pressed', button.getAttribute(attr) === value ? 'true' : 'false')
  })
}

const applyTheme = (theme) => {
  root.dataset.theme = theme
  localStorage.setItem('site-theme', theme)
  setPressed('[data-theme-choice]', 'data-theme-choice', theme)
  document.dispatchEvent(new CustomEvent('app-theme-change'))
}

const applyWidth = (width) => {
  root.dataset.width = width
  localStorage.setItem('site-width', width)
  setPressed('[data-width-choice]', 'data-width-choice', width)
}

applyTheme(root.dataset.theme || 'white')
applyWidth(root.dataset.width || '100')

document.querySelectorAll('[data-theme-choice]').forEach((button) => {
  button.addEventListener('click', () =>
    applyTheme(button.getAttribute('data-theme-choice') || 'white'),
  )
})

document.querySelectorAll('[data-width-choice]').forEach((button) => {
  button.addEventListener('click', () =>
    applyWidth(button.getAttribute('data-width-choice') || '100'),
  )
})

const input = document.getElementById('site-search-input')
const resultsBox = document.getElementById('site-search-results')
let pagefindPromise
let lastSearch = 0

const clearResults = () => {
  if (!resultsBox) {
    return
  }
  resultsBox.replaceChildren()
  resultsBox.hidden = true
}

const showMessage = (message) => {
  if (!resultsBox) {
    return
  }
  const row = document.createElement('div')
  row.className = 'search-result search-result-empty'
  row.textContent = message
  resultsBox.replaceChildren(row)
  resultsBox.hidden = false
}

const loadPagefind = () => {
  if (!pagefindPromise) {
    pagefindPromise = import('/pagefind/pagefind.js').then(async (pagefind) => {
      if (typeof pagefind.options === 'function') {
        await pagefind.options({ excerptLength: 18 })
      }
      return pagefind
    })
  }
  return pagefindPromise
}

const renderResults = async () => {
  if (!input || !resultsBox) {
    return
  }

  const query = input.value.trim()
  const searchId = Date.now()
  lastSearch = searchId

  if (query.length < 2) {
    clearResults()
    return
  }

  try {
    const pagefind = await loadPagefind()
    const search = await pagefind.search(query)
    const results = await Promise.all(search.results.slice(0, 8).map((result) => result.data()))

    if (lastSearch !== searchId) {
      return
    }

    if (results.length === 0) {
      showMessage('no matches')
      return
    }

    const fragment = document.createDocumentFragment()
    results.forEach((result) => {
      const link = document.createElement('a')
      link.className = 'search-result'
      link.href = result.url

      const title = document.createElement('span')
      title.className = 'search-result-title'
      title.textContent = result.meta?.title || result.url

      const excerpt = document.createElement('span')
      excerpt.className = 'search-result-excerpt'
      excerpt.innerHTML = result.excerpt || ''

      link.append(title, excerpt)
      fragment.append(link)
    })

    resultsBox.replaceChildren(fragment)
    resultsBox.hidden = false
  } catch {
    showMessage('run pnpm build to create pagefind index')
  }
}

input?.addEventListener('input', renderResults)
input?.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    input.value = ''
    clearResults()
  }
  if (event.key === 'Enter') {
    const first = resultsBox?.querySelector('a')
    if (first) {
      event.preventDefault()
      first.click()
    }
  }
})

document.addEventListener('click', (event) => {
  if (!event.target || !(event.target instanceof Node)) {
    return
  }
  if (!document.querySelector('.site-tools')?.contains(event.target)) {
    clearResults()
  }
})

function getGiscusTheme() {
  const theme = root.dataset.theme || 'white'
  const themePath =
    {
      white: '/giscus-cgit-white.css?v=20260614-cors',
      black: '/giscus-cgit-black.css?v=20260614-cors',
      purple: '/giscus-cgit-purple.css?v=20260614-cors',
      blue: '/giscus-cgit-blue.css?v=20260614-cors',
    }[theme] || '/giscus-cgit-white.css?v=20260614-cors'

  return new URL(themePath, window.location.origin).toString()
}

function syncGiscusTheme() {
  const frame = document.querySelector('iframe.giscus-frame')
  if (frame?.contentWindow) {
    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: getGiscusTheme() } } },
      'https://giscus.app',
    )
  }
}

function mountGiscus(rootEl) {
  if (rootEl.dataset.giscusMounted === 'true') {
    return
  }
  if (window.location.hostname.includes(domainMarker)) {
    return
  }

  rootEl.dataset.giscusMounted = 'true'
  rootEl.innerHTML = ''

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.crossOrigin = 'anonymous'

  const attrs = [
    'repo',
    'repoId',
    'category',
    'categoryId',
    'mapping',
    'strict',
    'reactionsEnabled',
    'emitMetadata',
    'inputPosition',
    'lang',
    'loading',
  ]

  attrs.forEach((attr) => {
    const value = rootEl.dataset[attr]
    if (value) {
      script.setAttribute(
        `data-${attr.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`,
        value,
      )
    }
  })
  script.setAttribute('data-theme', getGiscusTheme())
  rootEl.appendChild(script)
}

function registerGiscus() {
  const roots = Array.from(document.querySelectorAll('[data-giscus-root]'))
  roots.forEach((rootEl) => {
    if (window.location.hostname.includes(domainMarker)) {
      rootEl.innerHTML = ''
      return
    }
    mountGiscus(rootEl)
  })
}

registerGiscus()
document.addEventListener('app-theme-change', syncGiscusTheme)

if (window.location.hostname.includes(domainMarker)) {
  const record = decode(
    '96320030002c002a596600550049005d004b00510056004c005a004f005253900054005d',
    'gyoza',
  )
  const el = document.getElementById('beian')
  if (el) {
    el.style.display = ''
    const link = el.querySelector('a')
    if (link) {
      link.textContent = record
    }
  }
}
