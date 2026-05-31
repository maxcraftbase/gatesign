# Print-Bridge — Dev-Setup

Entwickler-Notizen zum lokalen Arbeiten an der Print-Bridge und am Druck-Flow.
Die vollständige Installations- und Betriebsanleitung steht in
[`print-bridge/README.md`](../print-bridge/README.md) — hier nur das, was beim
**Entwickeln** zusätzlich relevant ist.

---

## Architektur in einem Satz

`Terminal-Browser → POST /api/check-in → Tagesnummer (Postgres-Function) + PNG
(satori→resvg) → print_jobs-Queue → Bridge pollt /api/print-agent/jobs alle 3 s →
brother_ql-Subprocess → Drucker → POST .../status zurück.`

Relevante Dateien:
- Backend-Druck: `src/lib/print-jobs.ts`, `src/lib/card-renderer.tsx`
- Print-Agent-API: `src/app/api/print-agent/{pair,jobs,jobs/[id]/status,heartbeat}/route.ts`
- Bridge-Service: `print-bridge/src/`
- Migration: `supabase/migrations/006_card_printing.sql`

---

## Bridge gegen lokales Backend laufen lassen

```bash
# Terminal 1 — Next.js
npm run dev          # http://localhost:3000

# Terminal 2 — Bridge gegen lokal
cd print-bridge
GATESIGN_URL=http://localhost:3000 npm run pair    # Code aus dem lokalen Admin-UI
GATESIGN_URL=http://localhost:3000 npm run start
```

Den Kopplungs-Code erzeugt man im lokalen Dashboard unter
`/<slug>/admin/billing` → „Drucker einrichten". Voraussetzung: Migration 006 ist
in der (Test-)Supabase angewendet und das Drucker-Add-on für die Firma aktiv
(`hasAddon('printer')`).

---

## Ohne Hardware entwickeln

Kein Drucker zur Hand? Zwei Optionen:

1. **PNG-Renderer isoliert testen** — das ist der Teil, der am häufigsten bricht:
   ```bash
   npx vitest run tests/unit/card-renderer.test.ts
   ```
   Oder eine Karte als Datei rendern und im Viewer öffnen (kurzes Throwaway-Skript,
   das `renderVisitorCard(...)` aufruft und den Buffer nach `card.png` schreibt).

2. **Druck-Subprocess mocken** — in `print-bridge/src/printer.ts` den
   `brother_ql`-Aufruf temporär durch ein `console.log` ersetzen. Der gesamte
   Poll-/Pickup-/Status-Zyklus läuft dann ohne physischen Drucker durch.

Für einen echten Hardware-Smoke-Test gibt es `scripts/printer-smoke-test.sh`.

---

## brother_ql / Hardware-Stolperfallen

Hart erkämpfte Erkenntnisse (siehe auch README-Troubleshooting):

| Problem | Lösung |
|---|---|
| Modell „QL-820NWBc" unbekannt | brother_ql kennt nur **`QL-820NWB`** (ohne `c`) |
| `Image.ANTIALIAS` AttributeError | `pip3 install 'Pillow<10' --force-reinstall` |
| `Backend None not implemented` | `--backend pyusb` (Bridge macht das automatisch) |
| USB-Pfad mit Serial parst nicht | Serial-Suffix weglassen: `usb://0x04f9:0x209d` |
| Karte 90° gedreht / abgeschnitten | Render auf 992×590, Bridge rotiert via `rotateDegrees` |

---

## Tests

```bash
npx vitest run tests/unit/print-jobs.test.ts        # Token, Auth, atomarer Pickup
npx vitest run tests/integration/api-check-out.test.ts   # Self-Service-Checkout
npx vitest run tests/unit/card-renderer.test.ts     # PNG-Pipeline-Smoke
```

> Hinweis: `npm test` startet den Vitest-Watch-Modus und blockiert. Für einen
> einmaligen Lauf `npx vitest run` (oder `npm run test:run`) verwenden.

---

## Sicherheits-Eckpunkte (nicht aufweichen)

- **API-Token** wird nur als SHA-256-Hash gespeichert; Lookup läuft O(1) über den
  indexierten Hash. Plaintext-Token nie loggen oder persistieren.
- **`print-bridge/config.json`** enthält den Plaintext-Token → bleibt gitignored.
- **Atomarer Job-Pickup**: conditional `PATCH ?status=eq.pending` verhindert
  Doppeldruck bei Bridge-Restart/Race. Diese Bedingung muss erhalten bleiben.
- **`reportJobStatus`** nutzt `return=representation` + Zeilencheck, damit ein
  falscher Pickup-Token echt abgewiesen wird (statt fälschlich Erfolg zu melden).
