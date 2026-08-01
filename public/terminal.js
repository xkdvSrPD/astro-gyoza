// terminal.js — 终端风动效：打字机 / 字符扰动 / 逐行入场 / 搜索状态行
// 全部动效在 prefers-reduced-motion 下自动关闭。

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- 打字机：站点描述逐字输出（仅首页、每会话一次） ---------- */
;(() => {
  const el = document.querySelector('[data-typewriter]')
  if (!el || reduceMotion) return
  if (window.location.pathname !== '/') return
  if (sessionStorage.getItem('desc-typed') === '1') return
  sessionStorage.setItem('desc-typed', '1')

  const text = el.dataset.text || el.textContent.trim()
  el.textContent = ''

  const cursor = document.createElement('span')
  cursor.className = 'tw-cursor'
  cursor.textContent = '▮'
  el.appendChild(cursor)

  let i = 0
  const tick = () => {
    if (i < text.length) {
      cursor.before(document.createTextNode(text[i]))
      i += 1
      setTimeout(tick, 30 + Math.random() * 45)
    } else {
      setTimeout(() => cursor.remove(), 3000)
    }
  }
  tick()
})()

/* ---------- 字符扰动：hover 时文本乱码后逐位还原 ---------- */
;(() => {
  if (reduceMotion) return
  const CHARS = '!<>-_\\/[]{}=+*^?#'

  document.querySelectorAll('[data-scramble]').forEach((el) => {
    const original = el.textContent
    let frame = 0
    let raf = null
    let queue = []

    const update = () => {
      let done = 0
      let out = ''
      for (const q of queue) {
        if (frame >= q.end) {
          out += q.ch
          done += 1
        } else if (frame >= q.start) {
          out += CHARS[Math.floor(Math.random() * CHARS.length)]
        } else {
          out += q.ch
        }
      }
      el.textContent = out
      if (done < queue.length) {
        frame += 1
        raf = requestAnimationFrame(update)
      } else {
        el.textContent = original
        raf = null
      }
    }

    el.addEventListener('mouseenter', () => {
      if (raf) cancelAnimationFrame(raf)
      queue = original.split('').map((ch, i) => ({
        ch,
        start: i * 2 + Math.floor(Math.random() * 8),
        end: i * 2 + 14 + Math.floor(Math.random() * 18),
      }))
      frame = 0
      raf = requestAnimationFrame(update)
    })
  })
})()

/* ---------- 逐行入场：进入视口的元素交错淡入 ---------- */
;(() => {
  const root = document.querySelector('[data-reveal-root]')
  if (!root || reduceMotion) return

  const targets = new Set()
  root.querySelectorAll(':scope > *').forEach((el) => targets.add(el))
  root
    .querySelectorAll('.content-body > *, .list-table tbody tr, .card-list li')
    .forEach((el) => targets.add(el))

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed')
          io.unobserve(entry.target)
        }
      })
    },
    { rootMargin: '0px 0px -10% 0px' },
  )

  targets.forEach((el) => {
    // 首屏已可见的元素不做动画，避免加载时闪烁
    const rect = el.getBoundingClientRect()
    if (rect.top < window.innerHeight && rect.bottom > 0) return

    el.setAttribute('data-reveal', '')
    const hidden = Array.from(el.parentElement.children).filter((c) =>
      c.hasAttribute('data-reveal'),
    )
    el.style.setProperty('--reveal-delay', `${Math.min(hidden.length * 40, 400)}ms`)
    io.observe(el)
  })
})()

/* ---------- 搜索命令行化：结果框顶部加 `$ grep` 状态行 ---------- */
;(() => {
  const input = document.getElementById('site-search-input')
  const box = document.getElementById('site-search-results')
  if (!input || !box) return

  const sync = () => {
    box.querySelector('.search-status')?.remove()
    if (box.hidden || box.children.length === 0) return
    const query = input.value.trim()
    if (query.length < 2) return

    const count = box.querySelectorAll('a.search-result').length
    const status = document.createElement('div')
    status.className = 'search-status'
    status.textContent = `$ grep -i "${query}" . — ${count} hit${count === 1 ? '' : 's'}`
    box.prepend(status)
  }

  new MutationObserver(sync).observe(box, {
    childList: true,
    attributes: true,
    attributeFilter: ['hidden'],
  })
})()
