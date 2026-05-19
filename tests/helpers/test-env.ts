/**
 * Mock-Helper für externe Services
 *
 * Verhindert echte API-Calls in Unit-Tests.
 * Sparen Geld, machen Tests deterministisch, schnell und offline-fähig.
 */

import { vi } from 'vitest';

// ─── Supabase REST-API Mock ────────────────────────────────────
// Du nutzt direkt fetch() gegen /auth/v1/token (Memory-Regel)
// → wir mocken das Fetch-Response statt @supabase/ssr

export interface MockSupabaseAuthOptions {
  /** Erfolgreicher Login? */
  success?: boolean;
  /** User-ID im Response (default: random UUID) */
  userId?: string;
  /** Email im Response */
  email?: string;
}

export function mockSupabaseLoginSuccess(opts: MockSupabaseAuthOptions = {}) {
  global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
    const u = url.toString();

    if (u.includes('/auth/v1/token')) {
      return new Response(
        JSON.stringify({
          access_token: 'mock-jwt-access-token',
          refresh_token: 'mock-jwt-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: {
            id: opts.userId ?? 'mock-user-id',
            email: opts.email ?? 'admin@test.de',
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }

    throw new Error(`Unmocked fetch: ${u}`);
  }) as typeof fetch;
}

export function mockSupabaseLoginFailure() {
  global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
    const u = url.toString();

    if (u.includes('/auth/v1/token')) {
      return new Response(
        JSON.stringify({
          error: 'invalid_grant',
          error_description: 'Invalid login credentials',
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } },
      );
    }

    throw new Error(`Unmocked fetch: ${u}`);
  }) as typeof fetch;
}

// ─── Brevo (Email) Mock ────────────────────────────────────────

export function mockBrevoEmailSuccess() {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 201,
    json: async () => ({ messageId: '<mock-id@brevo.com>' }),
  } as Response);
}

export function mockBrevoEmailFailure(status = 401) {
  return vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: async () => ({ message: 'Mock Brevo error' }),
  } as Response);
}

// ─── DeepL (Translation) Mock ──────────────────────────────────

export function mockDeepLTranslate(translations: Record<string, string> = {}) {
  return vi.fn().mockImplementation(async (text: string) => {
    return translations[text] ?? `[translated] ${text}`;
  });
}

// ─── Generischer Multi-Endpoint-Mock ───────────────────────────
/**
 * Wenn ein Test mehrere verschiedene fetch-Calls macht,
 * kann er Routen pro URL-Pattern registrieren.
 */
export function mockFetchRoutes(
  routes: Record<string, { status: number; body: unknown }>,
) {
  global.fetch = vi.fn().mockImplementation(async (url: string | URL) => {
    const u = url.toString();

    for (const [pattern, response] of Object.entries(routes)) {
      if (u.includes(pattern)) {
        return new Response(JSON.stringify(response.body), {
          status: response.status,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    throw new Error(`Unmocked fetch: ${u}`);
  }) as typeof fetch;
}
