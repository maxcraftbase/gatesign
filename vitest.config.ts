import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest-Konfiguration für GateSign
 *
 * Test-Schichten:
 *  - tests/unit/**       → reine Logik-Tests, gemockte Abhängigkeiten (schnell)
 *  - tests/integration/** → mit echter Test-Supabase, langsamer
 *  - tests/e2e/**         → wird von Playwright separat ausgeführt (nicht hier)
 */
export default defineConfig({
  test: {
    // Test-Setup vor jedem Test-File ausführen (mockt Env, lädt Helpers)
    setupFiles: ['./tests/setup.ts'],

    // Welche Dateien Vitest als Tests erkennt
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],

    // Diese explizit ausschließen — werden von Playwright geführt
    exclude: ['node_modules', 'tests/e2e/**', '.next', 'dist'],

    // jsdom statt node — wir testen auch React-Komponenten ohne Browser
    environment: 'jsdom',

    // Globale APIs (describe, it, expect) ohne Import verfügbar machen
    globals: true,

    // Coverage-Einstellungen
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      reportsDirectory: './coverage',

      // Was wird gemessen?
      include: ['src/**/*.{ts,tsx}'],

      // Was nicht — Typen, Generated, Mocks
      exclude: [
        'src/**/*.test.{ts,tsx}',
        'src/**/*.d.ts',
        'src/**/types.ts',
        'src/app/**/page.tsx', // Page-Komponenten lieber per E2E testen
        'src/app/**/layout.tsx',
        '**/node_modules/**',
      ],

      // Schwellen — CI failt, wenn Coverage drunter fällt
      // Erstmal niedrig, wir bauen hoch
      thresholds: {
        lines: 40,
        functions: 40,
        branches: 35,
        statements: 40,
      },
    },

    // Tests parallel ausführen (nutzt alle CPU-Kerne)
    pool: 'threads',
    poolOptions: {
      threads: {
        // CI: max 4 Threads, lokal: alle verfügbaren
        maxThreads: process.env.CI ? 4 : undefined,
      },
    },

    // Pro Test-File max 10 Sekunden — fängt Endlos-Loops
    testTimeout: 10_000,

    // Reporter — in CI strukturiertes Output, lokal hübsch
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: {
      junit: './test-results/junit.xml',
    },
  },

  // Path-Aliases synchron zu tsconfig.json: nur @/* -> ./src/*
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
