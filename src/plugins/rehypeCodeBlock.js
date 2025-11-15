import { h } from 'hastscript'
import { visit } from 'unist-util-visit'

export function rehypeCodeBlock() {
  return function (tree) {
    visit(tree, { tagName: 'pre' }, (node, index, parent) => {
      const child = node.children[0]
      if (!child || child.type !== 'element' || child.tagName !== 'code' || !child.properties) {
        return
      }
      const classes = child.properties.className
      let lang = ''
      if (!classes) {
        node.children[0].properties = {
          className: ['language-text'],
        }
        lang = 'text'
      } else {
        lang = classes[0].slice(9)
      }

      const codeBlock = h('div', { class: 'code-block' }, [
        h(
          'button',
          {
            class: 'copy-code-btn',
            'data-lang': lang,
            'data-label': '复制',
            title: `复制 ${lang} 代码`,
            type: 'button',
          },
          [
            h('span', { class: 'copy-code-btn__icon', 'aria-hidden': 'true' }),
            h('span', { class: 'copy-code-btn__text' }, lang.toUpperCase()),
            h('span', { class: 'sr-only' }, '复制代码'),
          ],
        ),
        node,
      ])

      parent.children[index] = codeBlock
    })
  }
}
