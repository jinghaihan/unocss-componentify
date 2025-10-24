import type { Targets } from 'lightningcss'

export interface CommandOptions {
  cwd?: string
  /**
   * Glob pattern to match files
   */
  include?: string | string[]
  /**
   * Standard reset CSS stylesheets to be included
   * https://unocss.dev/guide/style-reset
   */
  resetCSS?: string
  /**
   * Extra Styles to be bundled into the generated
   */
  userStyle?: string
  /**
   * Output directory or file path
   * - If a directory is specified, each matched file from include pattern will generate a separate .ts file named after the original filename
   * - If a file path is specified, the output will be written to that path with a .ts extension
   * @default 'src/.generated/css.ts'
   */
  output?: string
  /**
   * Whether to minify the output CSS
   * @default true
   */
  minify?: boolean
}

export interface ConfigOptions {
  /**
   * The browser targets for the generated code.
   */
  targets?: Targets
}

export interface Options extends CommandOptions, ConfigOptions {}
