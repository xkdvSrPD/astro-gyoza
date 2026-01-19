import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const repoAUrl = 'https://git.vio.vin/violet/transform-obsidian.git'
const repoBUrl = 'https://git.vio.vin/violet/obsidian.git'
const repoAPath = '/tmp/transform-obsidian'
const repoBPath = path.join(repoAPath, 'obsidian')
const repoRoot = process.cwd()

const outputContentPath = path.join(repoAPath, 'output', 'content')
const outputImagePath = path.join(repoAPath, 'output', 'image')
const targetContentPath = path.join(repoRoot, 'src', 'content', 'posts')
const targetImagePath = path.join(repoRoot, 'public', 'image')

const run = (command, options = {}) => {
  execSync(command, { stdio: 'inherit', ...options })
}

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true })
}

const ensureRepoA = () => {
  if (!fs.existsSync(repoAPath)) {
    run(`git clone ${repoAUrl} ${repoAPath}`)
    return
  }

  if (!fs.existsSync(path.join(repoAPath, '.git'))) {
    throw new Error(`Expected git repo at ${repoAPath}, but .git is missing.`)
  }
}

const ensureRepoB = () => {
  if (!fs.existsSync(repoBPath)) {
    run(`git clone ${repoBUrl} ${repoBPath} --depth=1`)
    return
  }

  if (!fs.existsSync(path.join(repoBPath, '.git'))) {
    fs.rmSync(repoBPath, { recursive: true, force: true })
    run(`git clone ${repoBUrl} ${repoBPath} --depth=1`)
    return
  }

  run(`git -C ${repoBPath} remote set-url origin ${repoBUrl}`)
  run(`git -C ${repoBPath} fetch --prune`)
  run(`git -C ${repoBPath} pull --rebase`)
}

const ensureRepoADeps = () => {
  if (!fs.existsSync(path.join(repoAPath, 'node_modules'))) {
    run('pnpm install', { cwd: repoAPath })
  }
}

const copyOutput = () => {
  ensureDir(targetContentPath)
  ensureDir(targetImagePath)

  if (fs.existsSync(outputContentPath)) {
    fs.cpSync(outputContentPath, targetContentPath, { recursive: true, force: true })
  }

  if (fs.existsSync(outputImagePath)) {
    fs.cpSync(outputImagePath, targetImagePath, { recursive: true, force: true })
  }
}

const main = () => {
  ensureRepoA()
  ensureRepoB()
  ensureRepoADeps()
  run('pnpm dev', { cwd: repoAPath })
  copyOutput()
}

main()
