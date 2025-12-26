import { useEffect, useState } from 'react'
import { getRelativeTime, getFormattedDateTime } from '@/utils/date'

interface BuildInfo {
  gitHash: string
  buildTime: string
}

export function BuildInfo() {
  const [buildInfo, setBuildInfo] = useState<BuildInfo | null>(null)
  const [relativeTime, setRelativeTime] = useState<string | null>(null)

  useEffect(() => {
    // 在客户端读取构建信息
    fetch('/build-info.json')
      .then((res) => res.json())
      .then((data: BuildInfo) => {
        setBuildInfo(data)
        const buildDate = new Date(data.buildTime)
        const relative = getRelativeTime(buildDate)
        setRelativeTime(relative)
      })
      .catch(() => {
        // 如果文件不存在或读取失败，静默失败
      })
  }, [])

  if (!buildInfo) {
    return null
  }

  const buildDate = new Date(buildInfo.buildTime)
  const displayTime = relativeTime || getFormattedDateTime(buildDate)

  return (
    <span>
      <code className="text-xs font-mono bg-primary/10 px-1.5 py-0.5 rounded">{buildInfo.gitHash}</code>
      <span className="select-none opacity-50 mx-1">|</span>
      {relativeTime ? `已构建 ${relativeTime}` : `构建于 ${displayTime}`}
    </span>
  )
}

