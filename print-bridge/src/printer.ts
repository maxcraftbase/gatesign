/**
 * Drucker-Anbindung über `brother_ql` (Python-Subprocess).
 *
 * Begründung: die Node-Libs für Brother QL sind seit 2022 nicht mehr gepflegt.
 * Python `brother_ql` ist die Referenzimplementierung der Community, robust und
 * unterstützt USB + TCP/9100 mit identischer CLI.
 *
 * Voraussetzung auf dem Bridge-Host:
 *   pip3 install 'Pillow<10' brother_ql
 *   brew install libusb   (macOS)
 *   apt install libusb-1.0-0  (Linux/Pi)
 */

import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { log } from './logger.ts'

export type PrintResult =
  | { ok: true }
  | { ok: false; kind: 'paper_out'; message: string }
  | { ok: false; kind: 'error';     message: string }

export interface PrintOptions {
  /** PNG-Bytes (rohes Buffer, kein base64) */
  png: Buffer
  /** USB- oder TCP-Pfad, z.B. 'usb://0x04f9:0x209d' oder 'tcp://192.168.1.42' */
  target: string
  /** Brother-Modell-Name, z.B. 'QL-820NWB' */
  model: string
  /** Label-Typ — '54' für 54mm endlos (DK-N55224) */
  label?: string
  /** Rotation in Grad — 90 wenn das PNG quer ist und brother_ql es hochkant braucht */
  rotateDegrees?: number
}

/** Druckt eine Karte. Liefert PrintResult mit erkennbarem Fehler-Typ zurück. */
export async function printCard(opts: PrintOptions): Promise<PrintResult> {
  const tmpPath = path.join(os.tmpdir(), `gatesign-job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`)
  fs.writeFileSync(tmpPath, opts.png)

  try {
    const args = [
      '--backend', detectBackend(opts.target),
      '--model', opts.model,
      '--printer', opts.target,
      'print',
      '--label', opts.label ?? '54',
    ]
    if (opts.rotateDegrees !== undefined && opts.rotateDegrees !== 0) {
      args.push('--rotate', String(opts.rotateDegrees))
    }
    args.push(tmpPath)

    const result = await runBrotherQl(args)
    if (result.code === 0) return { ok: true }

    const stderr = (result.stderr ?? '').toLowerCase()
    if (stderr.includes('cover') || stderr.includes('no media') || stderr.includes('paper')) {
      return { ok: false, kind: 'paper_out', message: result.stderr || result.stdout || 'Rolle leer oder Cover offen' }
    }
    return { ok: false, kind: 'error', message: result.stderr || result.stdout || `brother_ql exit ${result.code}` }
  } finally {
    fs.unlink(tmpPath, () => { /* cleanup, ignore */ })
  }
}

/** Fragt brother_ql nach allen gefundenen Druckern (für CLI 'discover'). */
export async function discoverPrinters(): Promise<string[]> {
  const result = await runBrotherQl(['--backend', 'pyusb', 'discover'])
  if (result.code !== 0) {
    log.warn('brother_ql discover fehlgeschlagen', { stderr: result.stderr.slice(0, 200) })
    return []
  }
  // brother_ql gibt die URLs zeilenweise aus
  const lines = (result.stdout + '\n' + result.stderr)
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.startsWith('usb://'))
  // Suffix-Bug: brother_ql discover hängt manchmal '_XYZ' Seriennummer-Reste an,
  // die das CLI selbst nicht parsen kann. Schneiden wir es ab.
  return lines.map(stripUsbSerial)
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function detectBackend(target: string): 'pyusb' | 'network' {
  if (target.startsWith('tcp://')) return 'network'
  return 'pyusb'
}

/** Entfernt das problematische Seriennummer-Suffix aus 'usb://0x04f9:0x209d_Jb'. */
function stripUsbSerial(url: string): string {
  // Format: usb://VID:PID  oder  usb://VID:PID_XYZ → letzteres wollen wir nicht
  const m = url.match(/^(usb:\/\/0x[0-9a-f]+:0x[0-9a-f]+)/i)
  return m ? m[1] : url
}

interface SubprocessResult {
  code: number
  stdout: string
  stderr: string
}

function runBrotherQl(args: string[]): Promise<SubprocessResult> {
  return new Promise((resolve) => {
    const child = spawn('brother_ql', args, { stdio: ['ignore', 'pipe', 'pipe'] })

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', d => { stdout += d.toString() })
    child.stderr.on('data', d => { stderr += d.toString() })

    child.on('close', code => resolve({ code: code ?? -1, stdout, stderr }))
    child.on('error', err => resolve({ code: -1, stdout, stderr: err.message }))
  })
}
