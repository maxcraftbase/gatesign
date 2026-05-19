/**
 * Globales Test-Setup — wird vor jeder Test-Datei geladen.
 *
 * WICHTIG: Env-Variablen werden auf TOP-LEVEL gesetzt (nicht in beforeAll),
 * damit Module wie src/lib/supabase-server.ts beim Import die Werte sehen.
 */

import { afterEach, vi } from 'vitest'

// ─── Env-Variablen ─────────────────────────────────────────────
// Müssen vor allen src/-Imports stehen, sonst werfen `process.env.X!`
// und @t3-oss/env-nextjs einen Fehler.
// NODE_ENV setzt Vitest selbst auf 'test' — hier nicht überschreiben.

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co'
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key-dummy'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-key-dummy'

// Superadmin-Auth: deterministischer Test-Wert
process.env.SUPERADMIN_PASSWORD = 'test-superadmin-pw'
process.env.SITE_PASSWORD = 'test-site-pw'

// External APIs (gemockt, Werte egal)
process.env.BREVO_API_KEY = 'test-brevo-key'
process.env.DEEPL_API_KEY = 'test-deepl-key'
process.env.DIGEST_FROM_EMAIL = 'test@gatesign.de'
process.env.CRON_SECRET = 'test-cron-secret'

// App URLs
process.env.APP_URL = 'http://localhost:3000'
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000'

// ─── Globale Cleanup-Logik ────────────────────────────────────
afterEach(() => {
  vi.restoreAllMocks()
  vi.clearAllMocks()
})
