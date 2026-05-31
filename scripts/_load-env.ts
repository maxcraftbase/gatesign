/**
 * Lädt .env.local in process.env vor allen anderen Imports.
 * Wird von Dev-Skripten als ERSTER Import benutzt, damit sie wie Next.js-
 * Code Zugriff auf Env-Vars haben.
 *
 * Verwendung:
 *   import './_load-env'   // muss erste Zeile sein
 *   import { ... } from '../src/lib/...'
 */

import fs from 'node:fs'
import path from 'node:path'

const candidates = [
  '.env.local',
  '.env.development.local',
  '.env',
]

for (const file of candidates) {
  const fullPath = path.resolve(process.cwd(), file)
  if (!fs.existsSync(fullPath)) continue

  const content = fs.readFileSync(fullPath, 'utf-8')
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (!line || line.startsWith('#')) continue
    const match = line.match(/^([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/)
    if (!match) continue

    const key = match[1]
    let value = match[2]

    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    // Don't overwrite existing env vars (CI/Railway may have set them)
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}
