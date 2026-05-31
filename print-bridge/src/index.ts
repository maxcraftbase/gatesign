#!/usr/bin/env -S npx tsx
/**
 * GateSign Print-Bridge — CLI Entry Point.
 *
 * Commands:
 *   pair     — Interaktives Pairing mit dem Backend, schreibt config.json
 *   start    — Startet den Poll-Loop (3s) und druckt eingehende Jobs
 *   status   — Zeigt den aktuellen Konfig- und Verbindungsstatus
 *   reset    — Löscht die Konfiguration (für erneutes Pairing)
 *
 * Beispiel:
 *   GATESIGN_URL=https://www.gatesign.de npm run pair
 *   npm run start
 */

import { setTimeout as sleep } from 'node:timers/promises'
import { configExists, configPath, deleteConfig, loadConfig } from './config.ts'
import { pollNextJob, reportStatus, sendHeartbeat } from './api.ts'
import { printCard } from './printer.ts'
import { runPairingFlow } from './pairing.ts'
import { log } from './logger.ts'

const DEFAULT_BASE_URL = process.env.GATESIGN_URL ?? 'http://localhost:3000'

const [, , command] = process.argv

async function main() {
  switch (command) {
    case 'pair':
      await cmdPair()
      break
    case 'start':
      await cmdStart()
      break
    case 'status':
      cmdStatus()
      break
    case 'reset':
      cmdReset()
      break
    default:
      printHelp()
      process.exit(command ? 1 : 0)
  }
}

function printHelp() {
  console.log(`GateSign Print-Bridge

Verwendung:
  npm run pair      Bridge initial koppeln (interaktiv)
  npm run start     Poll-Loop starten und Druckjobs verarbeiten
  npm run status    Aktuellen Status anzeigen
  npm run reset     Konfiguration löschen

Backend-URL via Env:
  GATESIGN_URL=https://www.gatesign.de npm run pair
  (Default: http://localhost:3000)
`)
}

// ─────────────────────────────────────────────────────────────────────────────
// Commands
// ─────────────────────────────────────────────────────────────────────────────

async function cmdPair() {
  if (configExists()) {
    log.warn(`Konfiguration existiert bereits: ${configPath()}`)
    log.warn('Erst "npm run reset" ausführen, dann "npm run pair".')
    process.exit(1)
  }
  await runPairingFlow(DEFAULT_BASE_URL)
  console.log()
  log.success('Bridge ist gekoppelt. Starte den Service mit: npm run start')
}

function cmdStatus() {
  if (!configExists()) {
    log.warn('Bridge nicht gekoppelt.')
    log.info(`Erwarteter Pfad: ${configPath()}`)
    log.info('Pairing starten:  npm run pair')
    return
  }
  const cfg = loadConfig()
  console.log(`
Konfiguration: ${configPath()}
  Backend:        ${cfg.baseUrl}
  Bridge-ID:      ${cfg.bridgeId}
  Terminal-ID:    ${cfg.terminalId}
  Drucker-Ziel:   ${cfg.printerTarget}
  Drucker-Modell: ${cfg.printerModel}
  Poll-Intervall: ${cfg.pollIntervalMs ?? 3000} ms
  Rotation:       ${cfg.rotateDegrees ?? 90}°
`)
}

function cmdReset() {
  deleteConfig()
  log.success('Konfiguration gelöscht.')
}

async function cmdStart() {
  if (!configExists()) {
    log.error('Bridge nicht gekoppelt. Starte zuerst "npm run pair".')
    process.exit(1)
  }
  const cfg = loadConfig()
  log.success(`Bridge gestartet — Backend: ${cfg.baseUrl}`)
  log.info(`Drucker: ${cfg.printerTarget} (${cfg.printerModel})`)

  // Initial-Heartbeat: dem Backend mitteilen dass wir online sind
  await sendHeartbeat({ cfg, status: 'online', error: null })

  // Graceful Shutdown — informiere Backend dass wir offline gehen
  let stopping = false
  const handleSignal = async (signal: string) => {
    if (stopping) return
    stopping = true
    log.warn(`${signal} empfangen — beende Bridge…`)
    await sendHeartbeat({ cfg, status: 'offline' })
    process.exit(0)
  }
  process.on('SIGINT', () => void handleSignal('SIGINT'))
  process.on('SIGTERM', () => void handleSignal('SIGTERM'))

  const interval = cfg.pollIntervalMs ?? 3000
  let consecutiveErrors = 0

  while (!stopping) {
    try {
      const job = await pollNextJob(cfg)

      if (job === 'unauthorized') {
        log.error('API-Token ungültig. Bridge muss neu gepaart werden.')
        log.info('  → npm run reset && npm run pair')
        process.exit(2)
      }

      if (job === null) {
        // Kein Job — normal, einfach warten
        consecutiveErrors = 0
      } else {
        consecutiveErrors = 0
        log.step(`Druckjob ${job.id.slice(0, 8)} — drucke…`)
        const png = Buffer.from(job.png_base64, 'base64')
        const result = await printCard({
          png,
          target: cfg.printerTarget,
          model: cfg.printerModel,
          label: '54',
          rotateDegrees: cfg.rotateDegrees ?? 90,
        })

        if (result.ok) {
          log.success(`Druckjob ${job.id.slice(0, 8)} gedruckt`)
          await reportStatus({ cfg, jobId: job.id, pickupToken: job.pickup_token, status: 'printed' })
        } else if (result.kind === 'paper_out') {
          log.warn(`Drucker leer/Cover offen — Job ${job.id.slice(0, 8)} bleibt in Queue`)
          await reportStatus({
            cfg, jobId: job.id, pickupToken: job.pickup_token,
            status: 'paper_out', errorMessage: result.message,
          })
        } else {
          log.error(`Drucker-Fehler bei Job ${job.id.slice(0, 8)}`, result.message)
          await reportStatus({
            cfg, jobId: job.id, pickupToken: job.pickup_token,
            status: 'failed', errorMessage: result.message,
          })
        }
      }
    } catch (err) {
      consecutiveErrors++
      log.error(`Poll-Fehler (${consecutiveErrors})`, err)
      // Backoff: bei wiederholten Fehlern länger warten (max 30s)
      const backoff = Math.min(interval * Math.pow(2, consecutiveErrors - 1), 30_000)
      await sleep(backoff)
      continue
    }

    await sleep(interval)
  }
}

main().catch(err => {
  log.error('Bridge unerwartet beendet', err)
  process.exit(1)
})
