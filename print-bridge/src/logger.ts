/**
 * Minimaler strukturierter Logger.
 * In Produktions-Bundles später ggf. durch pino/winston ersetzen.
 */

const colors = {
  reset: '\x1b[0m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function timestamp(): string {
  return new Date().toLocaleTimeString('de-DE', { hour12: false })
}

export const log = {
  info: (msg: string, meta?: Record<string, unknown>) => {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.cyan}ℹ${colors.reset}  ${msg}${meta ? ' ' + colors.dim + JSON.stringify(meta) + colors.reset : ''}`)
  },
  success: (msg: string, meta?: Record<string, unknown>) => {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.green}✓${colors.reset}  ${msg}${meta ? ' ' + colors.dim + JSON.stringify(meta) + colors.reset : ''}`)
  },
  warn: (msg: string, meta?: Record<string, unknown>) => {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.yellow}⚠${colors.reset}  ${msg}${meta ? ' ' + colors.dim + JSON.stringify(meta) + colors.reset : ''}`)
  },
  error: (msg: string, err?: unknown) => {
    const detail = err instanceof Error ? err.message : err ? String(err) : ''
    console.error(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.red}✗${colors.reset}  ${msg}${detail ? ' — ' + detail : ''}`)
  },
  step: (msg: string) => {
    console.log(`${colors.dim}[${timestamp()}]${colors.reset} ${colors.blue}→${colors.reset}  ${msg}`)
  },
}
