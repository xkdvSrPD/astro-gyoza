import rehypeShiki from '@shikijs/rehype'

export const rehypeCodeHighlight = [
  rehypeShiki,
  {
    themes: {
      light: 'github-light',
      dark: 'github-dark',
    },
    defaultColor: false,
    defaultLanguage: 'text',
    fallbackLanguage: 'text',
  },
]
