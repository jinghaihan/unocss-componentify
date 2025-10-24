import type { Options } from './types'
import pkg from '../package.json'

export const NAME = pkg.name

export const VERSION = pkg.version

export const DEFAULT_OUTPUT = 'src/.generated/css.ts'

export const DEFAULT_OPTIONS: Partial<Options> = {
  output: DEFAULT_OUTPUT,
  minify: true,
}
