/**
 * Dev-Helper: erzeugt einen Pairing-Code für eine Print-Bridge.
 *
 * Bis die richtige Admin-UI in Phase 9 fertig ist, nutzen wir dieses Skript,
 * um den End-to-End-Druckpfad testen zu können.
 *
 * Verwendung:
 *   npx tsx scripts/dev-pair-bridge.ts <terminal_id>
 *   npx tsx scripts/dev-pair-bridge.ts <slug> <terminal_slug>
 *
 * Beispiele:
 *   npx tsx scripts/dev-pair-bridge.ts ruther-logistik haupteingang
 *   npx tsx scripts/dev-pair-bridge.ts 8f3a1c00-…-…
 */

import './_load-env'   // MUSS erste Zeile sein, damit .env.local vor allen anderen Imports geladen wird
import { startPairing } from '../src/lib/print-jobs'
import { getCompanyBySlug, getTerminalBySlug } from '../src/lib/company'

async function main() {
  const args = process.argv.slice(2)
  if (args.length === 0 || args.length > 2) {
    console.error('Usage:')
    console.error('  npx tsx scripts/dev-pair-bridge.ts <terminal_id>')
    console.error('  npx tsx scripts/dev-pair-bridge.ts <slug> <terminal_slug>')
    process.exit(1)
  }

  let companyId: string
  let terminalId: string

  if (args.length === 1) {
    // UUID-Form: brauchen wir Company-ID aus Terminal-Row
    terminalId = args[0]
    const r = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/terminals?id=eq.${terminalId}&select=id,company_id,name`,
      { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` } },
    )
    const rows = await r.json() as { id: string; company_id: string; name: string }[]
    if (rows.length === 0) {
      console.error(`Terminal ${terminalId} nicht gefunden.`)
      process.exit(1)
    }
    companyId = rows[0].company_id
    console.log(`Terminal: ${rows[0].name} (${terminalId})`)
  } else {
    // slug + terminal_slug Form
    const [slug, terminalSlug] = args
    const company = await getCompanyBySlug(slug)
    if (!company) {
      console.error(`Company '${slug}' nicht gefunden.`)
      process.exit(1)
    }
    const terminal = await getTerminalBySlug(company.id, terminalSlug)
    if (!terminal) {
      console.error(`Terminal '${terminalSlug}' nicht gefunden in '${slug}'.`)
      process.exit(1)
    }
    companyId = company.id
    terminalId = terminal.id
    console.log(`Company: ${company.name} (${slug})`)
    console.log(`Terminal: ${terminal.name} (${terminalSlug})`)
  }

  const result = await startPairing({
    companyId,
    terminalId,
    displayName: 'Dev-Test-Bridge',
  })

  console.log()
  console.log('═════════════════════════════════════════════')
  console.log(`  Pairing-Code:  ${result.pairingCode}`)
  console.log(`  Gültig bis:    ${new Date(result.expiresAt).toLocaleString('de-DE')}`)
  console.log('═════════════════════════════════════════════')
  console.log()
  console.log('Bridge koppeln in einem zweiten Terminal:')
  console.log('  cd print-bridge && npm run pair')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
