import { existsSync } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname } from 'pathe'

export async function isDirectory(path: string) {
  if (existsSync(path)) {
    const stats = await stat(path)
    return stats.isDirectory()
  }
  if (extname(path) === '.ts')
    return false
  return true
}

export async function normalizeOutput(path: string) {
  if (path.endsWith('.ts'))
    return path
  return `${path}.ts`
}
