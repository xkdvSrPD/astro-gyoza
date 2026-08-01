// terminal.js — 终端风动效与交互：打字机 / 字符扰动 / 逐行入场 / 伪 shell / 快捷键 / boot 序列
// 动效类功能在 prefers-reduced-motion 下自动关闭；伪 shell 与快捷键始终可用。

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

/* ---------- 站点数据（Layout 注入） ---------- */
const shellDataEl = document.getElementById('shell-data')
let shellData = { user: 'violet', posts: [] }
try {
  if (shellDataEl) shellData = JSON.parse(shellDataEl.textContent)
} catch {
  /* ignore */
}

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

/* ---------- 字符扰动（scramble）：hover 触发 + h1 加载时自动入场 ---------- */
const SCRAMBLE_CHARS = '!<>-_\\/[]{}=+*^?#'

function makeScramble(el) {
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
        out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
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

  return () => {
    if (raf) cancelAnimationFrame(raf)
    queue = original.split('').map((ch, i) => ({
      ch,
      start: i * 2 + Math.floor(Math.random() * 8),
      end: i * 2 + 14 + Math.floor(Math.random() * 18),
    }))
    frame = 0
    raf = requestAnimationFrame(update)
  }
}

;(() => {
  if (reduceMotion) return

  document.querySelectorAll('[data-scramble]').forEach((el) => {
    el.addEventListener('mouseenter', makeScramble(el))
  })

  // 页面主标题加载时自动 scramble 入场一次
  document.querySelectorAll('main.content h1').forEach((el) => {
    setTimeout(makeScramble(el), 250)
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

/* ---------- 伪 shell：搜索框即命令行 ---------- */
;(() => {
  const input = document.getElementById('site-search-input')
  const box = document.getElementById('site-search-results')
  if (!input || !box) return

  const user = shellData.user || 'violet'
  const posts = Array.isArray(shellData.posts) ? shellData.posts : []
  const bootTime = Date.now()

  const line = (text) => ({ text })
  const link = (text, href) => ({ text, href })

  const commands = {
    help: () => [
      line('available commands:'),
      line('  ls        list all posts'),
      line('  pwd       print working directory'),
      line('  whoami    print current user'),
      line('  date      print system date'),
      line('  uptime    print system uptime'),
      line('  echo ...  print arguments'),
      line('  clear     clear the terminal'),
      line('  exit      close the terminal'),
      line('  <text>    grep posts (pagefind)'),
    ],
    ls: () => [line(`total ${posts.length}`), ...posts.map((p) => link(`${p.d}  ${p.t}`, p.s))],
    pwd: () => [line(`/home/${user}/blog`)],
    whoami: () => [line(user)],
    date: () => [line(new Date().toString())],
    uptime: () => {
      const oldest = posts[posts.length - 1]
      const days = oldest
        ? Math.max(1, Math.floor((Date.now() - new Date(oldest.d).getTime()) / 86400000))
        : 0
      const secs = Math.floor((Date.now() - bootTime) / 1000)
      return [
        line(
          ` ${new Date().toTimeString().slice(0, 8)} up ${days} days, session ${secs}s, ` +
            `load average: 0.42, 0.36, 0.31`,
        ),
      ]
    },
    clear: () => 'clear',
    exit: () => 'exit',
  }

  const run = (query) => {
    const [cmd, ...args] = query.trim().split(/\s+/)

    if (cmd === 'echo') {
      return [line(args.join(' ') || '')]
    }
    if (cmd === 'sudo') {
      const rest = args.join(' ')
      return rest === 'make me a sandwich'
        ? [line('okay.')]
        : [line(`${user} is not in the sudoers file. This incident will be reported.`)]
    }
    const handler = commands[cmd]
    return handler ? handler(args) : null
  }

  const render = (output) => {
    const fragment = document.createDocumentFragment()
    output.forEach((row) => {
      const el = document.createElement(row.href ? 'a' : 'div')
      el.className = row.href ? 'search-result shell-output' : 'shell-line shell-output'
      if (row.href) el.href = row.href
      el.textContent = row.text
      fragment.appendChild(el)
    })
    box.replaceChildren(fragment)
    box.hidden = false
  }

  // site.js 的 renderResults 会调用这个钩子；返回 true 表示查询已被 shell 处理
  window.__terminalShell = (query) => {
    const output = run(query)
    if (output === null) return false
    if (output === 'clear' || output === 'exit') {
      box.replaceChildren()
      box.hidden = true
      if (output === 'exit') input.blur()
      return true
    }
    render(output)
    return true
  }
})()

/* ---------- 搜索状态行：结果框顶部显示 `$ grep` ---------- */
;(() => {
  const input = document.getElementById('site-search-input')
  const box = document.getElementById('site-search-results')
  if (!input || !box) return

  const sync = () => {
    box.querySelector('.search-status')?.remove()
    if (box.hidden || box.children.length === 0) return
    if (box.querySelector('.shell-output')) return
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

/* ---------- 键盘快捷键：`/` 搜索，`t` 切主题，`g h/a/f` 跳转 ---------- */
;(() => {
  const input = document.getElementById('site-search-input')
  const themes = ['white', 'black', 'purple', 'blue']
  let gPending = false
  let gTimer = null

  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    const target = event.target
    if (
      target instanceof HTMLElement &&
      (target.matches('input, textarea, select') || target.isContentEditable)
    ) {
      return
    }

    if (event.key === '/') {
      event.preventDefault()
      input?.focus()
      return
    }

    if (event.key === 't') {
      const current = document.documentElement.dataset.theme || 'white'
      const next = themes[(themes.indexOf(current) + 1) % themes.length]
      document.querySelector(`[data-theme-choice="${next}"]`)?.click()
      return
    }

    if (event.key === 'g') {
      gPending = true
      clearTimeout(gTimer)
      gTimer = setTimeout(() => (gPending = false), 800)
      return
    }

    if (gPending) {
      gPending = false
      clearTimeout(gTimer)
      const routes = { h: '/', a: '/archives', f: '/friends' }
      if (routes[event.key]) {
        window.location.href = routes[event.key]
      }
    }
  })
})()

/* ---------- boot 序列：首页每会话一次 ---------- */
;(() => {
  if (reduceMotion) return
  if (window.location.pathname !== '/') return
  if (sessionStorage.getItem('booted') === '1') return
  sessionStorage.setItem('booted', '1')

  const overlay = document.createElement('div')
  overlay.className = 'boot-overlay'
  overlay.setAttribute('aria-hidden', 'true')
  document.body.appendChild(overlay)

  const lines = [
    '[  OK  ] mounted /dev/mind',
    '[  OK  ] started pagefind.service',
    '[  OK  ] started giscus.service',
    '[  OK  ] reached target gyoza.target',
    '',
    `${shellData.user || 'violet'}@gyoza:~$ ./start-blog --mode=cgit`,
  ]

  let i = 0
  const next = () => {
    if (i < lines.length) {
      const row = document.createElement('div')
      row.textContent = lines[i] || ' '
      overlay.appendChild(row)
      i += 1
      setTimeout(next, 110)
    } else {
      setTimeout(() => {
        overlay.classList.add('boot-done')
        setTimeout(() => overlay.remove(), 450)
      }, 400)
    }
  }
  next()
})()
