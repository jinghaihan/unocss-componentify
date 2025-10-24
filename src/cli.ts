import type { CAC } from 'cac'
import type { CommandOptions } from './types'
import process from 'node:process'
import * as p from '@clack/prompts'
import c from 'ansis'
import { cac } from 'cac'
import { buildCSS } from './builder'
import { resolveConfig } from './config'
import { NAME, VERSION } from './constants'

try {
  const cli: CAC = cac(NAME)

  cli
    .command('', 'An agnostic UnoCSS generator that creates isolated styles for each component')
    .option('--cwd <cwd>', 'Specify the current working directory')
    .option('--include <patterns>', 'Glob pattern to match files')
    .option('--reset-css <module>', 'Standard reset CSS stylesheets to be included')
    .option('--user-style <path>', 'Extra Styles to be bundled into the generated')
    .option('--output <output>', 'Output directory or file path')
    .option('--minify', 'Whether to minify the output CSS')
    .allowUnknownOptions()
    .action(async (options: Partial<CommandOptions>) => {
      p.intro(`${c.yellow`${NAME} `}${c.dim`v${VERSION}`}`)

      const config = await resolveConfig(options)
      await buildCSS(config)

      p.outro(`${c.green('✓')} CSS built`)
    })

  cli.help()
  cli.version(VERSION)
  cli.parse()
}
catch (error) {
  console.error(error)
  process.exit(1)
}
