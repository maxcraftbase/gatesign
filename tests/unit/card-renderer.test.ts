/**
 * Unit-Test: src/lib/card-renderer.tsx — Visitor-Card PNG-Generator.
 *
 * Smoke-Test der vollen Pipeline (JSX → satori → SVG → resvg → PNG):
 * verifiziert, dass ein gültiger PNG-Buffer herauskommt. Kein Pixel-Snapshot
 * (zu fragil über resvg/Font-Versionen), aber genug, um Regressionen im
 * Renderer-Setup (Fonts geladen, satori/resvg verdrahtet) zu fangen.
 */

import { describe, it, expect } from 'vitest'
import { renderVisitorCard } from '@/lib/card-renderer'

// PNG-Signatur: 89 50 4E 47 0D 0A 1A 0A
const PNG_MAGIC = '89504e470d0a1a0a'

describe('renderVisitorCard', () => {
  it('rendert einen gültigen PNG-Buffer', async () => {
    const png = await renderVisitorCard({
      cardNumber: 42,
      visitorName: 'Max Mustermann',
      visitorCompany: 'Rüther Logistik GmbH',
      hostCompanyName: 'Müller Industrie',
      language: 'de',
    })
    expect(Buffer.isBuffer(png)).toBe(true)
    expect(png.subarray(0, 8).toString('hex')).toBe(PNG_MAGIC)
    // Eine reale Karte ist deutlich größer als ein paar Bytes
    expect(png.length).toBeGreaterThan(2000)
  }, 20_000)

  it('rendert auch für eine andere Besuchersprache (Footer-Hinweis)', async () => {
    const png = await renderVisitorCard({
      cardNumber: 1,
      visitorName: 'John Doe',
      visitorCompany: 'Acme Ltd',
      hostCompanyName: 'Müller Industrie',
      language: 'en',
    })
    expect(png.subarray(0, 8).toString('hex')).toBe(PNG_MAGIC)
  }, 20_000)

  it('verträgt eine dreistellige Tagesnummer ohne zu werfen', async () => {
    const png = await renderVisitorCard({
      cardNumber: 999,
      visitorName: 'Erika Mustermann',
      visitorCompany: 'Beispiel GmbH',
      hostCompanyName: 'Müller Industrie',
    })
    expect(png.subarray(0, 8).toString('hex')).toBe(PNG_MAGIC)
  }, 20_000)
})
