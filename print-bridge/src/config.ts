/**
 * Bridge-Konfiguration: persistent unter ~/.gatesign-bridge/config.json.
 * Wird beim ersten Start (pair-Command) erstellt, danach von start gelesen.
 */

import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

export interface BridgeConfig {
  /** Backend-URL, z.B. https://www.gatesign.de oder http://localhost:3000 */
  baseUrl: string
  /** API-Token vom Pairing, persistent gespeichert */
  apiToken: string
  /** Bridge-UUID aus dem Pairing-Response */
  bridgeId: string
  /** Terminal-UUID, das diese Bridge bedient */
  terminalId: string
  /** Company-UUID des Kunden */
  companyId: string
  /** USB- oder TCP-Pfad für brother_ql, z.B. 'usb://0x04f9:0x209d' */
  printerTarget: string
  /** Brother-Modell-Name für brother_ql (z.B. 'QL-820NWB') */
  printerModel: string
  /** Polling-Intervall in ms (default 3000) */
  pollIntervalMs?: number
  /** Rotation in Grad vor Brother-Druck (90 für Querformat → Hochformat) */
  rotateDegrees?: number
}

const CONFIG_DIR = path.join(os.homedir(), '.gatesign-bridge')
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json')

export function configExists(): boolean {
  return fs.existsSync(CONFIG_FILE)
}

export function loadConfig(): BridgeConfig {
  if (!configExists()) {
    throw new Error(
      `Keine Konfiguration gefunden unter ${CONFIG_FILE}.\n` +
      `Führe zuerst 'npm run pair' aus, um die Bridge zu koppeln.`,
    )
  }
  const raw = fs.readFileSync(CONFIG_FILE, 'utf-8')
  return JSON.parse(raw) as BridgeConfig
}

export function saveConfig(cfg: BridgeConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2) + '\n', { mode: 0o600 })
}

export function deleteConfig(): void {
  if (fs.existsSync(CONFIG_FILE)) fs.unlinkSync(CONFIG_FILE)
}

export function configPath(): string {
  return CONFIG_FILE
}
