import { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { pageScrollLocationAtom } from '@/store/scrollInfo'

export function ReadingProgress() {
  const [percent, setPercent] = useState(0)
  const scrollY = useAtomValue(pageScrollLocationAtom)

  useEffect(() => {
    const $article = document.querySelector('#markdown-wrapper')
    if (!$article) return

    const { offsetHeight, offsetTop } = $article as HTMLElement
    const fullHeight = offsetHeight + offsetTop - window.innerHeight

    if (scrollY > fullHeight) {
      setPercent(100)
    } else {
      setPercent(Math.floor((scrollY / fullHeight) * 100))
    }
  }, [scrollY])

  return (
    <div>
      <span className="text-sm">进度 {percent}%</span>
    </div>
  )
}
