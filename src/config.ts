import type { CommandOptions, Options } from './types'
import process from 'node:process'
import { toArray } from '@antfu/utils'
import * as p from '@clack/prompts'
import { loadConfig } from '@unocss/config'
import c from 'ansis'
import { createConfigLoader } from 'unconfig'
import { DEFAULT_OPTIONS, DEFAULT_RESET } from './constants'

function normalizeConfig(options: Partial<CommandOptions>) {
  // interop
  if ('default' in options)
    options = options.default as Partial<CommandOptions>

  return options
}

export async function readConfig(options: Partial<CommandOptions>) {
  const loader = createConfigLoader<CommandOptions>({
    sources: [
      {
        files: ['uno-webcomp.config'],
        extensions: ['ts'],
      },
    ],
    cwd: options.cwd || process.cwd(),
    merge: false,
  })
  const config = await loader.load()
  return config.sources.length ? normalizeConfig(config.config) : {}
}

export async function resolveConfig(options: Partial<CommandOptions>): Promise<Options> {
  const defaults = structuredClone(DEFAULT_OPTIONS)
  options = normalizeConfig(options)

  const configOptions = await readConfig(options)
  const resolved = { ...defaults, ...configOptions, ...options }

  resolved.cwd = resolved.cwd ?? process.cwd()
  // @ts-expect-error - resetCss is an alias for resetCSS
  resolved.resetCSS = options.resetCSS ?? options.resetCss ?? DEFAULT_RESET

  if (!toArray(resolved.include).length) {
    p.outro(c.red`No include patterns provided, aborting`)
    process.exit(1)
  }

  return resolved
}

export async function readUnoConfig(options: Partial<CommandOptions>) {
  return (await loadConfig(options.cwd)).config
}
