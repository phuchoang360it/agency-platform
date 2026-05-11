#!/usr/bin/env tsx
/**
 * Wrapper around `payload generate:types`.
 * Run via: pnpm generate:types
 *
 * Regenerates src/payload-types.ts from the current collection/block definitions.
 * Must be run after any change to collections, blocks, or payload.config.ts.
 */

import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function main() {
  console.log('Generating Payload types…')
  const { stdout, stderr } = await execAsync('payload generate:types', {
    env: { ...process.env, PAYLOAD_CONFIG_PATH: 'src/payload.config.ts' },
  })
  if (stdout) console.log(stdout)
  if (stderr) console.error(stderr)
  console.log('Done.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
