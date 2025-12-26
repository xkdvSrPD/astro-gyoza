import { execSync } from 'child_process'
import { writeFileSync, mkdirSync } from 'fs'
import { join } from 'path'

try {
  // 获取 git commit hash
  let gitHash = 'unknown'
  try {
    gitHash = execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch (error) {
    console.warn('无法获取 git hash，使用默认值')
  }

  // 获取构建时间
  const buildTime = new Date().toISOString()

  // 构建信息对象
  const buildInfo = {
    gitHash,
    buildTime,
  }

  // 确保目录存在
  const srcOutputDir = join(process.cwd(), 'src', 'generated')
  mkdirSync(srcOutputDir, { recursive: true })

  // 写入到 src/generated（用于服务端读取）
  const srcOutputPath = join(srcOutputDir, 'build-info.json')
  writeFileSync(srcOutputPath, JSON.stringify(buildInfo, null, 2), 'utf-8')

  // 同时写入到 public 目录（用于客户端读取）
  const publicOutputDir = join(process.cwd(), 'public')
  mkdirSync(publicOutputDir, { recursive: true })
  const publicOutputPath = join(publicOutputDir, 'build-info.json')
  writeFileSync(publicOutputPath, JSON.stringify(buildInfo, null, 2), 'utf-8')

  console.log('✓ 构建信息已生成:', {
    gitHash,
    buildTime,
  })
} catch (error) {
  console.error('生成构建信息时出错:', error)
  process.exit(1)
}
