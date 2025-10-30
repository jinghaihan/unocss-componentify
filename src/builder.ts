import type { UnoGenerator } from 'unocss'
import type { Options } from './types'
import { Buffer } from 'node:buffer'
import { readFile, writeFile } from 'node:fs/promises'
import { toArray } from '@antfu/utils'
import * as p from '@clack/prompts'
import c from 'ansis'
import { resolveModulePath } from 'exsolve'
import { transform } from 'lightningcss'
import MagicString from 'magic-string'
import { basename, extname, join } from 'pathe'
import { glob } from 'tinyglobby'
import { createGenerator } from 'unocss'
import { readUnoConfig, resolveConfig } from './config'
import { DEFAULT_OUTPUT, DEFAULT_RESET } from './constants'
import { isDirectory, normalizeOutput } from './utils'

const cache = new Map<string, string>()

async function createUnoGenerator({ options, userCSS }: {
  options: Options
  userCSS?: MagicString
}): Promise<UnoGenerator> {
  const config = await readUnoConfig(options)
  const generator = await createGenerator(config)

  // Transform user style with UnoCSS transformers
  if (userCSS) {
    for (const transformer of generator.config.transformers || []) {
      await transformer.transform(userCSS, options.userStyle!, { uno: generator } as any)
    }
  }
  return generator
}

async function readResetCSS(options: Options): Promise<string> {
  const { resetCSS = DEFAULT_RESET } = options

  if (cache.has(resetCSS))
    return cache.get(resetCSS)!

  const content = await readFile(resolveModulePath(resetCSS), 'utf-8')
  cache.set(resetCSS, content)

  return content
}

async function generateCSS({ options, generator, userCSS, tokens }: {
  options: Options
  generator: UnoGenerator
  tokens: Set<string>
  userCSS?: MagicString
}): Promise<string | undefined> {
  // Generate CSS with UnoCSS
  const unoResult = await generator.generate(tokens)

  // Compose the CSS
  const resetCSS = await readResetCSS(options)
  const input = [
    resetCSS,
    userCSS?.toString() ?? '',
    unoResult.css,
  ].filter(Boolean).join('\n')

  // Minify the CSS with LightningCSS
  try {
    const { code: css } = transform({
      code: Buffer.from(input, 'utf-8'),
      filename: 'style.css',
      targets: options.targets,
      minify: options.minify,
    })
    return String(css)
  }
  catch (e: any) {
    console.error(`${c.red('!')} Failed to build css`, e)
    if (e.loc) {
      console.error('Error at line', e.loc.line, 'column', e.loc.column)
      console.error(input.split('\n')[e.loc.line - 1])
      console.error(`${' '.repeat(e.loc.column - 1)}^`)
    }
  }
}

async function readUserCSS(options: Options): Promise<MagicString | undefined> {
  if (!options.userStyle)
    return
  return new MagicString(await readFile(options.userStyle, 'utf-8').catch(() => ''))
}

export async function buildCSS(options?: Options) {
  options = options ?? await resolveConfig({})

  const { output = DEFAULT_OUTPUT } = options

  // Read user style
  const userCSS = await readUserCSS(options)
  const files = await glob(toArray(options.include), {
    cwd: options.cwd,
    absolute: true,
  })

  const isDir = await isDirectory(output)

  if (isDir) {
    for (const file of files) {
      const spinner = p.spinner()
      spinner.start(`Building ${c.yellow(basename(file))}`)

      const generator = await createUnoGenerator({ options, userCSS })
      const tokens = new Set<string>()

      const content = await readFile(file, 'utf-8')
      await generator.applyExtractors(content, file, tokens)

      const css = await generateCSS({
        options,
        generator,
        tokens,
        userCSS,
      })
      if (css) {
        const filename = await normalizeOutput(basename(file, extname(file)))
        const filepath = join(output, filename)
        await writeFile(filepath, `export default ${JSON.stringify(String(css))}`)
        spinner.stop(`${c.green('✓')} Built ${c.yellow(basename(file))}`)
      }
      else {
        spinner.stop(`${c.red('✗')} No CSS generated for ${c.yellow(basename(file))}`)
      }
    }
  }
  else {
    const spinner = p.spinner()
    spinner.start(`Building including ${c.yellow(files.length)} files`)

    const generator = await createUnoGenerator({ options, userCSS })
    const tokens = new Set<string>()

    for (const file of files) {
      const content = await readFile(file, 'utf-8')
      await generator.applyExtractors(content, file, tokens)
    }

    const css = await generateCSS({
      options,
      generator,
      tokens,
      userCSS,
    })
    if (css) {
      const filepath = await normalizeOutput(output)
      await writeFile(filepath, `export default ${JSON.stringify(String(css))}`)
      spinner.stop(`${c.green('✓')} Built including ${c.yellow(files.length)} files`)
    }
    else {
      spinner.stop(`${c.red('✗')} No CSS generated including ${c.yellow(files.length)} files`)
    }
  }
}
