/**
 * Standalone-Test für den Karten-Renderer.
 * Ruft renderVisitorCard() auf und schreibt das PNG in ein frisches Temp-Verzeichnis.
 * Der konkrete Pfad wird am Ende ausgegeben (zur Sichtkontrolle: `open <pfad>`).
 *
 * Ausführen:
 *   npx tsx scripts/render-test-card.ts
 *
 * Direkter Druck-Test (kombiniert mit Phase 0) — Pfad aus der Ausgabe einsetzen:
 *   brother_ql --backend pyusb --model QL-820NWB --printer usb://0x04f9:0x209d \
 *     print --label 54 <pfad>
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { renderVisitorCard } from '../src/lib/card-renderer'

async function main() {
  const start = Date.now()

  const png = await renderVisitorCard({
    cardNumber: 42,
    visitorName: 'Max Mustermann',
    visitorCompany: 'Rüther Logistik GmbH',
    hostCompanyName: 'Müller Industrie',
    date: new Date('2026-05-30T10:00:00'),
    language: (process.argv[2] as 'de' | 'en' | 'pl' | 'ro' | 'cs' | 'hu' | 'bg' | 'uk' | 'ru' | 'tr' | undefined) ?? 'de',
  })

  // mkdtempSync → nicht erratbares Temp-Verzeichnis (js/insecure-temporary-file).
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gatesign-card-'))
  const outPath = path.join(outDir, 'card.png')
  fs.writeFileSync(outPath, png)

  const ms = Date.now() - start
  const kb = (png.length / 1024).toFixed(1)

  console.log(`✓ Karte gerendert in ${ms} ms (${kb} KB)`)
  console.log(`  Pfad:  ${outPath}`)
  console.log(`  Größe: ${png.length} Bytes`)
  console.log('')
  console.log(`Sichtkontrolle:  open ${outPath}`)
}

main().catch((err) => {
  console.error('Renderer-Fehler:', err)
  process.exit(1)
})
