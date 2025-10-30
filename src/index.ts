import type { Options } from './types'

export * from './builder'
export * from './types'
export * from './watcher'

export function defineConfig(config: Partial<Options>) {
  return config
}
