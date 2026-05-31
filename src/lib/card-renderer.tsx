/**
 * GateSign Visitor-Card Renderer.
 *
 * Generiert die 88 × 55 mm Besucher-Visitenkarte (Layout V4) als PNG-Buffer.
 *
 * Pipeline:  JSX  →  satori  →  SVG  →  @resvg/resvg-js  →  PNG
 *
 * Bewusst KEIN @napi-rs/canvas — das crasht auf Railway (siehe Memory feedback_napi_rs_canvas).
 * resvg-js ist zwar auch Rust-native, aber Vercel/Railway-erprobt.
 *
 * Inter-Fonts werden einmalig beim Modul-Import in einen Cache geladen (Buffer
 * im Modul-Scope), damit jeder renderVisitorCard-Call ohne I/O auskommt.
 */

import React from 'react'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import fs from 'node:fs'
import path from 'node:path'
import { translations, type Language } from './translations'

// ─────────────────────────────────────────────────────────────────────────────
// Font-Cache (Modul-Scope, einmalig beim Import gelesen)
// ─────────────────────────────────────────────────────────────────────────────
const FONT_DIR = path.join(process.cwd(), 'public', 'fonts')
const INTER_REGULAR = fs.readFileSync(path.join(FONT_DIR, 'Inter-Regular.ttf'))
const INTER_BOLD    = fs.readFileSync(path.join(FONT_DIR, 'Inter-Bold.ttf'))
const INTER_BLACK   = fs.readFileSync(path.join(FONT_DIR, 'Inter-Black.ttf'))

// ─────────────────────────────────────────────────────────────────────────────
// Konstanten — Layout V4
// ─────────────────────────────────────────────────────────────────────────────
// Aspect-Ratio so gewählt, dass das Brother-Output 50 × 86 mm wird:
// - Brother QL-820NWBc DK-Continuous 54mm-Rolle: dots_printable = 590 px (~50 mm)
//   das sind die druckbaren Pixel nach Brother-Rand-Abzug (~2 mm pro Seite)
// - 84 mm Karten-Länge @ 300 dpi = 992 px (Kompromiss zur Standard-Visitenkartenhülle —
//   verlässlich kürzer, lässt Spielraum für Toleranzen beim Brother-Cut)
// - 50 mm Karten-Höhe @ 300 dpi = 590 px (statt nominell 55 mm — die fehlen physikalisch)
// Die Print-Bridge rotiert das PNG um 90° vor dem Senden an brother_ql.
const CARD_WIDTH_PX  = 992  // 84 mm @ 300 dpi (lange Seite)
const CARD_HEIGHT_PX = 590  // 50 mm @ 300 dpi (Druckkopf-Achse, durch Rolle limitiert)
const COLOR_TEXT     = '#0F172A'  // slate-900
const COLOR_MUTED    = '#334155'  // slate-700
const COLOR_DIM      = '#64748B'  // slate-500
const COLOR_BORDER   = '#E2E8F0'  // slate-200
const COLOR_NUMBER   = '#DC2626'  // red-600 — die Tagesnummer

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────
export interface VisitorCardOptions {
  /** Tagesnummer, fortlaufend pro Terminal pro Tag */
  cardNumber: number
  /** Vollständiger Besucher-Name */
  visitorName: string
  /** Entsendende Firma des Besuchers (z.B. "Rüther Logistik GmbH") */
  visitorCompany: string
  /** Host-Firma = der GateSign-Kunde (z.B. "Müller Industrie") */
  hostCompanyName: string
  /** Datum (default: now) */
  date?: Date
  /**
   * Sprache des Besuchers — bestimmt den Footer-Hinweis ("Bitte beim Verlassen
   * zurückgeben"). Datum + Host-Firma bleiben in der eingestellten Locale.
   * Default: 'de'.
   */
  language?: Language
}

/**
 * Rendert eine Besucher-Visitenkarte als PNG-Buffer.
 * Querformat 1039 × 650 px (88 × 55 mm @ 300 dpi).
 *
 * Die Print-Bridge rotiert das Bild ggf. um 90° bevor sie es an brother_ql
 * weitergibt (Brother-Druckkopf erwartet hochkant).
 */
export async function renderVisitorCard(opts: VisitorCardOptions): Promise<Buffer> {
  const date = opts.date ?? new Date()
  // Datum bleibt in der Host-Sprache (deutsch) — nur der Footer-Hinweis ist
  // für den Besucher in seiner Sprache.
  const dateLocale = 'de-DE'
  const visitorLanguage: Language = opts.language ?? 'de'

  const weekday = new Intl.DateTimeFormat(dateLocale, { weekday: 'long' }).format(date)
  const dateText = new Intl.DateTimeFormat(dateLocale, {
    day: '2-digit', month: 'long', year: 'numeric',
  }).format(date)

  const cardNumberText = String(opts.cardNumber).padStart(3, '0')
  const footerText = translations[visitorLanguage].card_footer_return

  // ───────────────────── JSX-Markup (Layout V4) ─────────────────────
  const markup = (
    <div
      style={{
        width: CARD_WIDTH_PX,
        height: CARD_HEIGHT_PX,
        backgroundColor: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '36px 48px',
        fontFamily: 'Inter',
        color: COLOR_TEXT,
      }}
    >
      {/* ── Header: Host-Firma links groß, Datum rechts klein ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          paddingBottom: 22,
          borderBottom: `1px solid ${COLOR_BORDER}`,
        }}
      >
        <div
          style={{
            fontSize: 60,
            fontWeight: 800,
            color: COLOR_TEXT,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'uppercase',
          }}
        >
          {opts.hostCompanyName}
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            color: COLOR_DIM,
            fontSize: 22,
            lineHeight: 1.3,
          }}
        >
          <span>{weekday}</span>
          <span style={{ fontWeight: 500 }}>{dateText}</span>
        </div>
      </div>

      {/* ── Body: Besucher-Info links, Tagesnummer rechts ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          padding: '28px 0',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: COLOR_DIM,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 12,
            }}
          >
            Besucher
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              color: COLOR_TEXT,
              letterSpacing: '-0.025em',
              lineHeight: 1.0,
            }}
          >
            {opts.visitorName}
          </div>
          <div
            style={{
              marginTop: 18,
              fontSize: 44,
              fontWeight: 600,
              color: COLOR_MUTED,
              letterSpacing: '-0.01em',
            }}
          >
            {opts.visitorCompany}
          </div>
        </div>
        <div
          style={{
            color: COLOR_NUMBER,
            fontWeight: 900,
            fontSize: 130,
            letterSpacing: '-0.05em',
            lineHeight: 0.9,
            textAlign: 'right',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 24,
          }}
        >
          {cardNumberText}
        </div>
      </div>

      {/* ── Footer: Hinweis zum Verlassen ── */}
      <div
        style={{
          paddingTop: 18,
          borderTop: `1px solid ${COLOR_BORDER}`,
          color: COLOR_DIM,
          fontSize: 20,
          textAlign: 'center',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        {footerText}
      </div>
    </div>
  )

  // ───────────────────── satori: JSX → SVG ─────────────────────
  const svg = await satori(markup, {
    width: CARD_WIDTH_PX,
    height: CARD_HEIGHT_PX,
    fonts: [
      { name: 'Inter', data: INTER_REGULAR, weight: 400, style: 'normal' },
      { name: 'Inter', data: INTER_BOLD,    weight: 700, style: 'normal' },
      { name: 'Inter', data: INTER_BOLD,    weight: 800, style: 'normal' },
      { name: 'Inter', data: INTER_BLACK,   weight: 900, style: 'normal' },
    ],
  })

  // ───────────────────── resvg: SVG → PNG ─────────────────────
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: CARD_WIDTH_PX },
    background: '#ffffff',
  })
  return resvg.render().asPng()
}
