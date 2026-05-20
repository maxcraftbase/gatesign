/**
 * Test-Faktories
 *
 * Erzeugen reproduzierbare Fake-Daten für Tests.
 * NIEMALS echte Kundendaten — DSGVO!
 *
 * Vorteil gegenüber Inline-Daten:
 *  - Tests bleiben kurz und lesbar
 *  - Änderungen am Schema → nur eine Stelle anpassen
 *  - Realistische, aber synthetische Daten
 */

import { randomUUID } from 'node:crypto';

// ─── Companies ───────────────────────────────────────────────

export interface TestCompany {
  id: string;
  name: string;
  slug: string;
  email: string;
  created_at: string;
}

export function createTestCompany(overrides: Partial<TestCompany> = {}): TestCompany {
  const id = randomUUID();
  return {
    id,
    name: `Test Logistik GmbH ${id.slice(0, 8)}`,
    slug: `test-${id.slice(0, 8)}`,
    email: `test-${id.slice(0, 8)}@example-gatesign-test.de`,
    created_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Check-ins ───────────────────────────────────────────────

export interface TestCheckIn {
  id: string;
  company_id: string;
  driver_name: string;
  license_plate: string;
  company_name: string;
  language: 'de' | 'en' | 'pl' | 'tr' | 'ro' | 'cs' | 'hu' | 'bg' | 'hr' | 'sk';
  signature_data_url: string;
  briefing_confirmed: boolean;
  checked_in_at: string;
}

export function createTestCheckIn(overrides: Partial<TestCheckIn> = {}): TestCheckIn {
  const id = randomUUID();
  return {
    id,
    company_id: randomUUID(),
    driver_name: 'Max Mustermann',
    license_plate: 'M-AB 1234',
    company_name: 'Fremdfirma Beispiel GmbH',
    language: 'de',
    // Minimal valides PNG (1x1 transparent) als Base64
    signature_data_url:
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    briefing_confirmed: true,
    checked_in_at: new Date().toISOString(),
    ...overrides,
  };
}

// ─── Admins ──────────────────────────────────────────────────

export interface TestAdmin {
  id: string;
  email: string;
  company_id: string;
  role: 'admin' | 'superadmin';
}

export function createTestAdmin(overrides: Partial<TestAdmin> = {}): TestAdmin {
  const id = randomUUID();
  return {
    id,
    email: `admin-${id.slice(0, 8)}@example-gatesign-test.de`,
    company_id: randomUUID(),
    role: 'admin',
    ...overrides,
  };
}

// ─── Hilfsfunktionen ─────────────────────────────────────────

/**
 * Erzeugt zwei isolierte Firmen für Isolation-Tests.
 * Use case: prüfen ob Firma A nicht auf Daten von Firma B zugreifen kann.
 */
export function createIsolatedCompanies() {
  const companyA = createTestCompany({ name: 'Firma A' });
  const companyB = createTestCompany({ name: 'Firma B' });
  const adminA = createTestAdmin({ company_id: companyA.id });
  const adminB = createTestAdmin({ company_id: companyB.id });
  const checkInA = createTestCheckIn({ company_id: companyA.id });
  const checkInB = createTestCheckIn({ company_id: companyB.id });

  return { companyA, companyB, adminA, adminB, checkInA, checkInB };
}
