import { createPortal } from 'react-dom'
import { useEffect, useState } from 'react'

export function RootPortal({
  to,
  children,
}: {
  to?: HTMLElement
  children: React.ReactNode
}) {
  const [target, setTarget] = useState<HTMLElement | null>(null)

  useEffect(() => {
    setTarget(to ?? document.body)
  }, [to])

  if (!target) return null

  return createPortal(children, target)
}
