import { execSync } from 'node:child_process'

export interface BuildInfo {
  gitHash: string
  buildTime: string
}

let buildInfo: BuildInfo | undefined

export function getBuildInfo(): BuildInfo {
  if (buildInfo) {
    return buildInfo
  }

  let gitHash = 'unknown'

  try {
    gitHash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    gitHash = 'unknown'
  }

  buildInfo = {
    gitHash: gitHash || 'unknown',
    buildTime: new Date().toISOString(),
  }

  return buildInfo
}
