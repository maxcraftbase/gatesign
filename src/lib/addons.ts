import { supabaseUrl, serviceKey } from '@/lib/supabase-server'
import { env } from '@/env'
import { getCompanyPlan } from '@/lib/subscription'
import type { BillingCycle, PlanName } from '@/lib/subscription'

/**
 * Add-on-Registry: Single Source of Truth für alle Add-ons (Pricing v2).
 * Neue Add-ons hier registrieren + Stripe-Prices in env.ts + Railway Vars setzen.
 */

export type AddonKey =
  | 'printer'
  | 'audit_export'
  | 'custom_branding'
  | 'extra_location'
  | 'briefing_translation'
  | 'priority_support'
  | 'outlook'

export type AddonStatus = 'active' | 'coming_soon'

export interface AddonDefinition {
  key: AddonKey
  label: string
  shortDescription: string
  status: AddonStatus
  pricing: {
    monthly: number
    yearly: number
    /** Falls einmaliger Hardware-Bestandteil (z. B. Drucker) */
    oneTimeHardware?: number
  }
  /** Plan-Namen, in denen das Add-on enthalten ist (also UI versteckt es) */
  includedIn: PlanName[]
  /** Stripe-Price-IDs aus env.ts (resolved at runtime) */
  stripeMonthlyPriceId: () => string | null | undefined
  stripeYearlyPriceId: () => string | null | undefined
  stripeHardwarePriceId?: () => string | null | undefined
}

export const ADDON_REGISTRY: Record<AddonKey, AddonDefinition> = {
  printer: {
    key: 'printer',
    label: 'Drucker-Print (Besucherkarten)',
    shortDescription: 'Brother QL-810W druckt bei jedem Check-in eine Visitenkarte mit Foto, Name und Host.',
    status: 'active',
    pricing: { monthly: 19, yearly: 190, oneTimeHardware: 299 },
    // Bewusst LEER: Drucker wird NIE über den Plan auto-aktiv. Er braucht physische
    // Hardware + eine gekoppelte Print-Bridge. Würde er in einem Plan „enthalten" sein,
    // zögen alle Firmen dieses Plans beim Check-in Tagesnummern, die ohne Drucker ins
    // Leere laufen (Besucher sieht eine Nummer, bekommt aber keine Karte). Nur via
    // expliziten company_addons-Kauf + Pairing.
    includedIn: [],
    stripeMonthlyPriceId: () => env.STRIPE_PRICE_ADDON_PRINTER_MONTHLY,
    stripeYearlyPriceId: () => env.STRIPE_PRICE_ADDON_PRINTER_YEARLY,
    stripeHardwarePriceId: () => env.STRIPE_PRICE_ADDON_PRINTER_HARDWARE,
  },
  audit_export: {
    key: 'audit_export',
    label: 'Audit-Export (Excel/CSV)',
    shortDescription: 'Audit-Log als Excel oder CSV exportieren — für DSGVO-Anfragen und Compliance.',
    status: 'active',
    pricing: { monthly: 19, yearly: 190 },
    includedIn: ['business', 'enterprise'],
    stripeMonthlyPriceId: () => env.STRIPE_PRICE_ADDON_AUDIT_EXPORT_MONTHLY,
    stripeYearlyPriceId: () => env.STRIPE_PRICE_ADDON_AUDIT_EXPORT_YEARLY,
  },
  custom_branding: {
    key: 'custom_branding',
    label: 'Custom Branding',
    shortDescription: 'Eigenes Logo und Firmenfarben am Terminal und in Briefings.',
    status: 'active',
    pricing: { monthly: 19, yearly: 190 },
    includedIn: ['enterprise'],
    stripeMonthlyPriceId: () => env.STRIPE_PRICE_ADDON_CUSTOM_BRANDING_MONTHLY,
    stripeYearlyPriceId: () => env.STRIPE_PRICE_ADDON_CUSTOM_BRANDING_YEARLY,
  },
  extra_location: {
    key: 'extra_location',
    label: 'Zusatz-Standort',
    shortDescription: 'Weiterer Standort mit eigenem Slug, eigenem Admin und eigenen Terminals.',
    status: 'active',
    pricing: { monthly: 29, yearly: 290 },
    includedIn: ['enterprise'],
    stripeMonthlyPriceId: () => env.STRIPE_PRICE_ADDON_EXTRA_LOCATION_MONTHLY,
    stripeYearlyPriceId: () => env.STRIPE_PRICE_ADDON_EXTRA_LOCATION_YEARLY,
  },
  briefing_translation: {
    key: 'briefing_translation',
    label: 'KI-Briefing-Übersetzung',
    shortDescription: 'Briefing-PDFs werden automatisch in alle 10 Sprachen übersetzt (DeepL).',
    status: 'active',
    pricing: { monthly: 15, yearly: 150 },
    includedIn: ['enterprise'],
    stripeMonthlyPriceId: () => env.STRIPE_PRICE_ADDON_BRIEFING_TRANSLATION_MONTHLY,
    stripeYearlyPriceId: () => env.STRIPE_PRICE_ADDON_BRIEFING_TRANSLATION_YEARLY,
  },
  priority_support: {
    key: 'priority_support',
    label: 'Prioritäts-Support',
    shortDescription: 'Bevorzugte Bearbeitung Ihrer Support-Anfragen, ohne SLA-Garantie.',
    status: 'active',
    pricing: { monthly: 29, yearly: 290 },
    includedIn: ['enterprise'],
    stripeMonthlyPriceId: () => env.STRIPE_PRICE_ADDON_PRIORITY_SUPPORT_MONTHLY,
    stripeYearlyPriceId: () => env.STRIPE_PRICE_ADDON_PRIORITY_SUPPORT_YEARLY,
  },
  outlook: {
    key: 'outlook',
    label: 'Outlook-Integration',
    shortDescription: 'Pre-Registration via Outlook-Kalender, Host-Benachrichtigung und Microsoft SSO.',
    status: 'coming_soon',
    pricing: { monthly: 29, yearly: 290 },
    includedIn: ['enterprise'],
    stripeMonthlyPriceId: () => null,
    stripeYearlyPriceId: () => null,
  },
}

export const ALL_ADDON_KEYS = Object.keys(ADDON_REGISTRY) as AddonKey[]

/** Add-on-Eintrag in DB. */
export interface CompanyAddonRow {
  company_id: string
  addon_key: AddonKey
  stripe_subscription_item_id: string | null
  billing_cycle: BillingCycle
  active_since: string
  /** Gekaufte Menge (Stripe-Item-Quantity). Für extra_location = Anzahl Zusatz-Standorte. */
  quantity: number
}

/** Liest alle aktiven Add-ons einer Company aus der DB. */
export async function getCompanyAddons(companyId: string): Promise<CompanyAddonRow[]> {
  const base = `${supabaseUrl}/rest/v1/company_addons?company_id=eq.${companyId}`
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` }

  // `quantity` kommt erst mit Migration 007. Schlägt der Select fehl (Spalte
  // existiert noch nicht → PostgREST 400), lesen wir ohne sie und behandeln
  // quantity als 1 — so kann der Code unabhängig vom Migrations-Zeitpunkt
  // deployen, ohne den Add-on-Lookup (und damit den Drucker) zu brechen.
  let res = await fetch(
    `${base}&select=company_id,addon_key,stripe_subscription_item_id,billing_cycle,active_since,quantity`,
    { headers, cache: 'no-store' },
  )
  if (!res.ok) {
    res = await fetch(
      `${base}&select=company_id,addon_key,stripe_subscription_item_id,billing_cycle,active_since`,
      { headers, cache: 'no-store' },
    )
  }
  if (!res.ok) return []
  const rows: CompanyAddonRow[] = await res.json()
  return rows
    .filter(r => ALL_ADDON_KEYS.includes(r.addon_key))
    .map(r => ({ ...r, quantity: Math.max(1, r.quantity ?? 1) }))
}

/**
 * Gekaufte Menge eines Add-ons (0 wenn nicht gekauft).
 * Plan-Bundling spielt hier bewusst keine Rolle: Mengen-Add-ons (extra_location)
 * sind in keinem Plan gebündelt — gebündelte Pläne (Enterprise) heben das Limit
 * ohnehin komplett auf (terminal_limit = null), bevor diese Funktion zählt.
 */
export async function getAddonQuantity(companyId: string, addonKey: AddonKey): Promise<number> {
  const rows = await getCompanyAddons(companyId)
  const row = rows.find(r => r.addon_key === addonKey)
  return row ? Math.max(1, row.quantity) : 0
}

/**
 * Prüft ob eine Company ein Add-on freigeschaltet hat — direkt aus DB.
 * Inkludiert Add-ons die durch den Plan automatisch dazugehören (z. B. Audit-Export in Business).
 *
 * Plan-Bundling: Add-ons mit `includedIn` sind in diesen Plänen automatisch aktiv.
 * Den Plan laden wir selbst, wenn der Aufrufer ihn nicht übergibt — sonst wäre das
 * Bundling totes Dead-Code (so war es bis zur Add-on-Durchsetzung). Add-ons ohne
 * `includedIn` (z. B. Drucker) überspringen den Plan-Lookup komplett, damit
 * Hot-Paths wie der Check-in keine zusätzliche DB-Query bezahlen.
 */
export async function hasAddon(companyId: string, addonKey: AddonKey, plan?: PlanName): Promise<boolean> {
  const addon = ADDON_REGISTRY[addonKey]
  if (!addon) return false

  if (addon.includedIn.length > 0) {
    const effectivePlan = plan ?? (await getCompanyPlan(companyId))?.plan ?? null
    if (effectivePlan && addon.includedIn.includes(effectivePlan)) return true
  }

  const rows = await getCompanyAddons(companyId)
  return rows.some(r => r.addon_key === addonKey)
}

/**
 * Standard-Antwortkörper für eine gesperrte Add-on-Funktion (HTTP 403).
 * Einheitliche Form `{ error: 'addon_required', addon, message }`, damit das
 * Frontend konsistent eine Upsell-Meldung anzeigen kann.
 */
export function addonRequiredError(addonKey: AddonKey): { error: 'addon_required'; addon: AddonKey; message: string } {
  const addon = ADDON_REGISTRY[addonKey]
  return {
    error: 'addon_required',
    addon: addonKey,
    message: `Diese Funktion gehört zum Add-on „${addon?.label ?? addonKey}". Bitte im Tarif-Bereich freischalten.`,
  }
}

/** Sucht den Add-on-Key zu einer Stripe Price-ID (für Webhook-Sync). */
export function addonKeyFromPriceId(priceId: string | null | undefined): AddonKey | null {
  if (!priceId) return null
  for (const addon of Object.values(ADDON_REGISTRY)) {
    if (addon.stripeMonthlyPriceId() === priceId) return addon.key
    if (addon.stripeYearlyPriceId() === priceId) return addon.key
  }
  return null
}

/** Resolved Add-on Stripe Price-ID anhand Add-on-Key + Cycle. */
export function addonPriceId(addonKey: AddonKey, cycle: BillingCycle): string | null {
  const addon = ADDON_REGISTRY[addonKey]
  if (!addon || addon.status !== 'active') return null
  const id = cycle === 'yearly' ? addon.stripeYearlyPriceId() : addon.stripeMonthlyPriceId()
  return id ?? null
}

/** Synchronisiert die DB mit dem aktuellen Stripe-Stand (Insert/Delete-Diff). */
export async function syncCompanyAddons(
  companyId: string,
  desired: { addon_key: AddonKey; stripe_subscription_item_id: string; billing_cycle: BillingCycle; quantity?: number }[],
) {
  const existing = await getCompanyAddons(companyId)
  const desiredKeys = new Set(desired.map(d => d.addon_key))
  const existingKeys = new Set(existing.map(e => e.addon_key))

  // Entfernen: in DB, aber nicht mehr gewünscht
  const toRemove = existing.filter(e => !desiredKeys.has(e.addon_key))
  for (const row of toRemove) {
    await fetch(
      `${supabaseUrl}/rest/v1/company_addons?company_id=eq.${companyId}&addon_key=eq.${row.addon_key}`,
      {
        method: 'DELETE',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'return=minimal' },
      },
    )
  }

  // Upsert: alles aus desired hinein
  if (desired.length) {
    const upsertRows = desired.map(d => ({
      company_id: companyId,
      addon_key: d.addon_key,
      stripe_subscription_item_id: d.stripe_subscription_item_id,
      billing_cycle: d.billing_cycle,
      quantity: Math.max(1, d.quantity ?? 1),
      updated_at: new Date().toISOString(),
      ...(existingKeys.has(d.addon_key) ? {} : { active_since: new Date().toISOString() }),
    }))
    await fetch(`${supabaseUrl}/rest/v1/company_addons`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify(upsertRows),
    })
  }
}
