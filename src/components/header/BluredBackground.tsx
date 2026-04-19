import { useHeaderBgOpacity } from './hooks'

export function BluredBackground() {
  const opacity = useHeaderBgOpacity()

  return (
    <div
      className="absolute inset-0 -z-1 border-b border-primary bg-white/72 dark:bg-zinc-800/72 backdrop-blur-md transform-gpu"
      style={{
        opacity,
      }}
    ></div>
  )
}
