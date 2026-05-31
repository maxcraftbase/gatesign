/**
 * Interaktiver Pairing-Flow:
 * 1. fragt den 8-stelligen Pairing-Code per CLI
 * 2. erkennt USB-Drucker automatisch (brother_ql discover)
 * 3. erlaubt manuelle TCP-Eingabe als Alternative
 * 4. ruft Backend, speichert Config
 */

import readline from 'node:readline/promises'
import { stdin, stdout } from 'node:process'
import { pairBridge } from './api.ts'
import { discoverPrinters } from './printer.ts'
import { saveConfig, type BridgeConfig } from './config.ts'
import { log } from './logger.ts'

export async function runPairingFlow(baseUrl: string): Promise<BridgeConfig> {
  const rl = readline.createInterface({ input: stdin, output: stdout })

  try {
    log.step('Suche angeschlossene Drucker via USB…')
    const found = await discoverPrinters()
    if (found.length > 0) {
      log.success(`${found.length} Drucker gefunden`)
      found.forEach((u, i) => console.log(`    [${i + 1}] ${u}`))
    } else {
      log.warn('Kein USB-Drucker gefunden — du kannst TCP-Ziel manuell eingeben.')
    }
    console.log()

    // ── Drucker-Auswahl ──
    let printerTarget: string
    if (found.length === 0) {
      printerTarget = (await rl.question('Drucker-Ziel (z.B. tcp://192.168.1.42 oder usb://0x04f9:0x209d): ')).trim()
    } else if (found.length === 1) {
      const confirm = (await rl.question(`Diesen Drucker verwenden? [${found[0]}] (Enter = ja): `)).trim()
      printerTarget = confirm.length > 0 ? confirm : found[0]
    } else {
      const choice = (await rl.question(`Welcher Drucker? [1-${found.length}]: `)).trim()
      const idx = Number.parseInt(choice, 10) - 1
      printerTarget = found[idx] ?? found[0]
    }
    if (!printerTarget) throw new Error('Kein Drucker-Ziel angegeben.')

    // ── Modell ──
    const modelAnswer = (await rl.question('Modell für brother_ql (Enter = QL-820NWB): ')).trim()
    const printerModel = modelAnswer.length > 0 ? modelAnswer : 'QL-820NWB'

    // ── Pairing-Code ──
    console.log()
    log.info('Hol dir den 8-stelligen Pairing-Code aus der GateSign-Admin-UI:')
    console.log('    /<dein-slug>/admin/billing → Drucker-Add-on → "Print-Bridge koppeln"')
    console.log()
    const code = (await rl.question('Pairing-Code: ')).trim().toUpperCase()
    if (code.length !== 8) throw new Error('Pairing-Code muss 8 Zeichen lang sein.')

    // ── Backend-Call ──
    console.log()
    log.step(`Sende Pairing an ${baseUrl}…`)
    const result = await pairBridge({ baseUrl, code, printerTarget, printerModel })
    log.success('Pairing erfolgreich!')

    const cfg: BridgeConfig = {
      baseUrl,
      apiToken: result.api_token,
      bridgeId: result.bridge_id,
      terminalId: result.terminal_id,
      companyId: result.company_id,
      printerTarget,
      printerModel,
      pollIntervalMs: 3000,
      rotateDegrees: 90,
    }
    saveConfig(cfg)
    log.success('Konfiguration gespeichert.')
    return cfg
  } finally {
    rl.close()
  }
}
