import type { Options } from './types'
import { toArray } from '@antfu/utils'
import chokidar from 'chokidar'
import { buildCSS } from './builder'
import { resolveConfig } from './config'

export async function watchCSS(options?: Options) {
  options = options ?? await resolveConfig({})

  const watcher = chokidar.watch(toArray(options.include), {
    cwd: options.cwd,
  })

  watcher.on('change', async () => {
    await buildCSS(options)
  })

  return watcher
}
