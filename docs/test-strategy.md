# GateSign Test-Strategie

Status: Phase T1 — Fundament
Stand: Mai 2026

## Risiko-Priorisierung

Wo tut ein Bug am meisten weh? (Reihenfolge = Test-Priorität)

1. **Datenschutz-Lecks** — Check-in Firma A in Firma B sichtbar (RLS-Bug)
2. **Auth-Bypass** — Superadmin-Token leakt, JWT-Refresh kaputt
3. **Terminal-Ausfall** — Fahrer können nicht einchecken
4. **Email/PDF kaputt** — Check-in geht durch, keiner erfährt's
5. **Subscription-Bypass** (ab Phase 4) — Kunde nutzt ohne zu zahlen
6. **Visuelle Regression** — Terminal sieht plötzlich falsch aus

## Test-Pyramide für GateSign

```
                  ▲
                 ╱ ╲      E2E (Playwright, ~15 Tests)
                ╱   ╲     - Terminal-Flow
               ╱     ╲    - Admin-Login + Dashboard
              ╱───────╲
             ╱         ╲  Integration (~25 Tests)
            ╱           ╲ - Auth-Flow
           ╱             ╲- Company-Isolation (RLS)
          ╱───────────────╲- API gegen Test-Supabase
         ╱                 ╲
        ╱                   ╲ Contract (~20 Tests)
       ╱                     ╲- Zod-Schemas
      ╱                       ╲- API Input/Output
     ╱─────────────────────────╲
    ╱                           ╲
   ╱                             ╲ Unit (~50 Tests)
  ╱                               ╲- Auth-Helper
 ╱                                 ╲- Business-Logik
╱───────────────────────────────────╲- PDF/Signatur-Utils
```

## Roadmap (5 Phasen)

### Phase T1 — Fundament (Tag 1) ← AKTUELL

- [x] Vitest installieren + konfigurieren
- [x] Test-Setup mit Env-Mocks
- [x] Faktories für Test-Daten
- [x] Husky + lint-staged
- [x] GitHub Actions ausgebaut
- [ ] Erste Unit-Tests für `superadmin-auth.ts`
- [ ] CI grün auf `main`

### Phase T2 — Contract Tests (Tag 2)

Für jede API-Route:
- Happy Path (200 + erwartetes Schema)
- Validation-Fehler (400 + Zod-Error)
- Auth-Fehler (401/403)
- Rate-Limit (429)

Priorität:
1. `POST /api/checkin`
2. `POST /api/admin/login`
3. `POST /api/admin/settings`
4. `POST /api/superadmin/*`

### Phase T3 — Integration (Tag 3) — DSGVO-KRITISCH

Test-Supabase aufsetzen, Seed-Script schreiben, dann:

**Company Isolation**:
- Admin A liest nicht Check-ins B
- Admin A schreibt nicht Settings B
- Superadmin liest beides
- `getAdminContext()` liefert korrekte company_id

**Auth-Flow**:
- Recovery-Link mit Hash-Fragment (Next.js 15 Quirk!)
- Invite via `generate_link` + Brevo-Mock
- HttpOnly-Cookie wird gesetzt, JS kann nicht lesen
- Railway-Trim-Bug Regression

**Rate Limiting**:
- 100 Logins/Min → 101. ist 429
- Bypass-Versuche werden geblockt

### Phase T4 — E2E (Tag 4)

**Terminal-Flow** (komplett):
- Sprache wählen
- Daten eintippen
- Sicherheitsbelehrung
- Signatur (Canvas-Interaktion)
- Submit
- Verify: DB-Entry, Email-Job, PDF generierbar

**Admin**:
- Login → Liste → Detail → PDF-Download
- Print-Flow via iframe (Safari-Fix-Regression!)

**a11y-Smoke** (BFSG ab 28.06.2025 Pflicht):
- `@axe-core/playwright` auf Terminal-Hauptseite
- Keine kritischen WCAG-Violations

**Visual Regression**:
- 3 Screenshots (Terminal-Start, Signatur, Erfolg)

### Phase T5 — CI härten (Tag 5)

- Branch-Protection auf `main`: kein Merge ohne grüne CI
- Coverage-Report als PR-Comment
- Smoke-Test gegen Railway-Staging nach jedem Merge
- Notification bei kaputter `main` → Slack/Email
- README-Badge

## Was bewusst weggelassen wird

- **Mutation Testing (Stryker)** — Overkill für Solo-Dev
- **Load Tests (k6)** — erst bei >10 parallelen Terminals
- **Chromatic/Percy** — kostet Geld, Playwright-Snapshots reichen
- **100% Coverage** — falsches Ziel, 80% bei kritischen Modulen genügt

## Coverage-Ziele

| Modul | Target |
|---|---|
| `src/lib/superadmin-auth.ts` | 95% |
| `src/lib/auth/*` | 90% |
| `src/lib/schemas/*` | 100% (Schemas sind klein) |
| `src/app/api/**/route.ts` | 80% |
| `src/components/Terminal/*` | 70% |
| Rest | best effort |

## Was Tests NICHT lösen

- **AVV mit Kunden** → juristisches Problem, nicht technisch
- **Brevo/DeepL/Supabase Ausfälle** → Sentry + Monitoring
- **Edge-Cases, an die niemand denkt** → Production-Monitoring

Tests sind ein **Sicherheitsnetz, kein Schutzwall**.
