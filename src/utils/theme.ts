const themeKey = 'gyoza-theme'
const hasWindow = typeof window !== 'undefined'
const hasDocument = typeof document !== 'undefined'
const hasLocalStorage = typeof localStorage !== 'undefined'

export type ThemeMode = 'light' | 'dark' | 'system'

export function changePageTheme(theme: ThemeMode) {
  if (!hasDocument) return
  document.documentElement.setAttribute('data-theme', theme)
}

export function getSystemTheme(): Exclude<ThemeMode, 'system'> {
  if (!hasWindow) return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function getLocalTheme(): ThemeMode {
  if (!hasLocalStorage) return 'system'

  const local = localStorage.getItem(themeKey)
  if (local === 'dark' || local === 'light') {
    return local
  } else {
    setLocalTheme('system')
    return 'system'
  }
}

export function setLocalTheme(theme: ThemeMode) {
  if (!hasLocalStorage) return
  localStorage.setItem(themeKey, theme)
}
