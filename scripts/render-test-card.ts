/**
 * Standalone-Test für den Karten-Renderer.
 * Ruft renderVisitorCard() auf und schreibt das PNG nach /tmp/gatesign-card.png.
 *
 * Ausführen:
 *   npx tsx scripts/render-test-card.ts
 *
 * Dann zur Sichtkontrolle:
 *   open /tmp/gatesign-card.png
 *
 * Direkter Druck-Test (kombiniert mit Phase 0):
 *   npx tsx scripts/render-test-card.ts && \
 *     PRINTER_USB="usb://0x04f9:0x209d" \
 *     brother_ql --backend pyusb --model QL-820NWB --printer usb://0x04f9:0x209d \
 *       print --label 54 /tmp/gatesign-card.png
 */

import fs from 'node:fs'
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

  const outPath = '/tmp/gatesign-card.png'
  fs.writeFileSync(outPath, png)

  const ms = Date.now() - start
  const kb = (png.length / 1024).toFixed(1)

  console.log(`✓ Karte gerendert in ${ms} ms (${kb} KB)`)
  console.log(`  Pfad:  ${outPath}`)
  console.log(`  Größe: ${png.length} Bytes`)
  console.log('')
  console.log('Sichtkontrolle:  open /tmp/gatesign-card.png')
}

main().catch((err) => {
  console.error('Renderer-Fehler:', err)
  process.exit(1)
})
