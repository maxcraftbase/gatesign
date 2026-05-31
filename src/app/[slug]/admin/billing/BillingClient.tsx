'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Check, CreditCard, ExternalLink, AlertCircle, Sparkles, Clock,
  Printer, FileSpreadsheet, Palette, Building2, Languages, Headset, CalendarDays,
} from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'
import { PrintBridgeManager } from '@/components/admin/PrintBridgeManager'
import { ADDON_REGISTRY, ALL_ADDON_KEYS, type AddonKey } from '@/lib/addons'
import type { PlanName, BillingCycle } from '@/lib/subscription'

/** Lucide-Icon pro Add-on. Konsistent mit AdminNav/SettingsSubNav-Styling. */
const ADDON_ICONS: Record<AddonKey, React.ReactNode> = {
  printer:              <Printer        className="w-5 h-5" strokeWidth={1.75} />,
  audit_export:         <FileSpreadsheet className="w-5 h-5" strokeWidth={1.75} />,
  custom_branding:      <Palette        className="w-5 h-5" strokeWidth={1.75} />,
  extra_location:       <Building2      className="w-5 h-5" strokeWidth={1.75} />,
  briefing_translation: <Languages      className="w-5 h-5" strokeWidth={1.75} />,
  priority_support:     <Headset        className="w-5 h-5" strokeWidth={1.75} />,
  outlook:              <CalendarDays   className="w-5 h-5" strokeWidth={1.75} />,
}

export interface BillingCompanyState {
  plan: PlanName
  cycle: BillingCycle
  subscriptionStatus: string
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  hasStripeCustomer: boolean
  hasActiveSubscription: boolean
  activeAddons: AddonKey[]
}

interface PlanDef {
  id: PlanName
  name: string
  monthlyPrice: number | null // null = on request
  yearlyPrice: number | null
  features: string[]
  highlight?: boolean
}

const PLANS: PlanDef[] = [
  {
    id: 'solo',
    name: 'Solo',
    monthlyPrice: 29,
    yearlyPrice: 290,
    features: ['1 Terminal', '1 Standort', 'Alle 10 Sprachen + DeepL', 'Audit-Log (DSGVO-konform)', 'Daily-Digest', 'E-Mail-Support'],
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 79,
    yearlyPrice: 790,
    features: ['3 Terminals', '3 Standorte', 'Alles aus Solo', 'Audit-Export (Excel/CSV)'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyPrice: null,
    yearlyPrice: null,
    features: ['Unbegrenzte Terminals', 'Unbegrenzte Standorte', 'Alle Add-ons inklusive', 'Persönliches Onboarding'],
  },
]

function formatDate(iso: string | null): string | null {
  if (!iso) return null
  try {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })
  } catch {
    return null
  }
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null
  const diff = new Date(iso).getTime() - Date.now()
  if (Number.isNaN(diff)) return null
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function statusLabel(status: string): { label: string; tone: 'neutral' | 'positive' | 'warning' | 'danger' } {
  switch (status) {
    case 'active':    return { label: 'Aktiv',          tone: 'positive' }
    case 'trialing':
    case 'trial':     return { label: 'Trial',          tone: 'neutral'  }
    case 'past_due':  return { label: 'Zahlung offen',  tone: 'warning'  }
    case 'canceled':  return { label: 'Gekündigt',      tone: 'danger'   }
    case 'unpaid':    return { label: 'Unbezahlt',      tone: 'danger'   }
    case 'incomplete':
    case 'incomplete_expired': return { label: 'Unvollständig', tone: 'warning' }
    default:          return { label: status || 'Unbekannt', tone: 'neutral' }
  }
}

export function BillingClient({
  state,
  stripeReady,
  successFlag,
  canceledFlag,
}: {
  state: BillingCompanyState
  stripeReady: boolean
  successFlag: boolean
  canceledFlag: boolean
}) {
  const router = useRouter()
  const [loadingPlan, setLoadingPlan] = useState<PlanName | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
  const [togglingAddon, setTogglingAddon] = useState<AddonKey | null>(null)
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>(state.cycle)
  const [error, setError] = useState<string | null>(null)

  const status = statusLabel(state.subscriptionStatus)
  const trialDate = formatDate(state.trialEndsAt)
  const trialDays = daysUntil(state.trialEndsAt)
  const periodEndDate = formatDate(state.currentPeriodEnd)
  const isOnTrial = state.subscriptionStatus === 'trial' || state.subscriptionStatus === 'trialing'

  async function handleChoose(plan: PlanName) {
    setError(null)
    setLoadingPlan(plan)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, cycle: selectedCycle, addons: [] }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout konnte nicht gestartet werden.')
      }
      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler.')
      setLoadingPlan(null)
    }
  }

  async function handlePortal() {
    setError(null)
    setPortalLoading(true)
    try {
      const res = await fetch('/api/customer-portal', { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Portal konnte nicht geöffnet werden.')
      }
      window.location.assign(data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler.')
      setPortalLoading(false)
    }
  }

  async function handleToggleAddon(key: AddonKey, currentlyActive: boolean) {
    setError(null)
    setTogglingAddon(key)
    try {
      const res = currentlyActive
        ? await fetch(`/api/addons?addon=${key}`, { method: 'DELETE' })
        : await fetch('/api/addons', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ addon: key }),
          })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data.error || 'Add-on konnte nicht aktualisiert werden.')
      }
      // Webhook braucht ein paar Sekunden — Refresh nach kurzer Wartezeit
      setTimeout(() => router.refresh(), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler.')
    } finally {
      setTogglingAddon(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Status-Banner */}
      {successFlag && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Plan erfolgreich aktiviert. Es kann einen Moment dauern, bis sich der Status hier aktualisiert.
        </div>
      )}
      {canceledFlag && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Vorgang abgebrochen — der Plan wurde nicht geändert.
        </div>
      )}
      {!stripeReady && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Stripe ist serverseitig noch nicht konfiguriert. Plan-Wechsel sind aktuell deaktiviert.</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 flex gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Status-Card */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-1">Aktueller Plan</p>
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-slate-900">{PLANS.find(p => p.id === state.plan)?.name ?? state.plan}</h2>
              <span
                className={clsx(
                  'inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border',
                  status.tone === 'positive' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
                  status.tone === 'neutral'  && 'border-slate-200 bg-slate-50 text-slate-700',
                  status.tone === 'warning'  && 'border-amber-200 bg-amber-50 text-amber-700',
                  status.tone === 'danger'   && 'border-rose-200 bg-rose-50 text-rose-700',
                )}
              >
                {status.label}
              </span>
              {state.hasActiveSubscription && (
                <span className="text-xs text-slate-500">
                  {state.cycle === 'yearly' ? 'Jährliche Abrechnung' : 'Monatliche Abrechnung'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {isOnTrial && trialDate ? (
                <>Trial läuft noch <strong className="text-slate-700">{trialDays ?? 0} {trialDays === 1 ? 'Tag' : 'Tage'}</strong> (bis {trialDate})</>
              ) : periodEndDate ? (
                <>Verlängert sich automatisch am {periodEndDate}</>
              ) : isOnTrial ? (
                <>Im Trial-Zeitraum</>
              ) : (
                <>Kein aktives Abonnement.</>
              )}
            </p>
          </div>

          {state.hasStripeCustomer && (
            <Button
              variant="secondary"
              onClick={handlePortal}
              loading={portalLoading}
              disabled={!stripeReady}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Zahlungsdaten & Rechnungen
            </Button>
          )}
        </div>
      </section>

      {/* Plan wechseln */}
      <section>
        <header className="mb-4 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Plan wählen</h3>
            <p className="text-sm text-slate-500">Jederzeit wechselbar, Abrechnung anteilig.</p>
          </div>
          <CycleToggle value={selectedCycle} onChange={setSelectedCycle} />
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map(plan => {
            const isCurrent = plan.id === state.plan && state.hasActiveSubscription && state.cycle === selectedCycle
            const price = selectedCycle === 'yearly' ? plan.yearlyPrice : plan.monthlyPrice
            return (
              <div
                key={plan.id}
                className={clsx(
                  'flex flex-col rounded-2xl border bg-white p-6 transition',
                  isCurrent ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200',
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-base font-semibold text-slate-900">{plan.name}</h4>
                  {plan.highlight && !isCurrent && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-white">
                      <Sparkles className="w-3 h-3" />
                      Empfohlen
                    </span>
                  )}
                  {isCurrent && (
                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-900 text-white">
                      Aktiv
                    </span>
                  )}
                </div>
                <div className="mb-4">
                  {price === null ? (
                    <span className="text-2xl font-bold text-slate-900">Auf Anfrage</span>
                  ) : (
                    <>
                      <span className="text-2xl font-bold text-slate-900">{price} €</span>
                      <span className="text-sm text-slate-500 ml-1">
                        {selectedCycle === 'yearly' ? 'pro Jahr' : 'pro Monat'}
                      </span>
                      {selectedCycle === 'yearly' && plan.monthlyPrice && (
                        <p className="text-xs text-emerald-700 mt-1">
                          = {Math.round(price / 12)} €/Monat · 2 Monate gratis
                        </p>
                      )}
                    </>
                  )}
                </div>
                <ul className="space-y-2 text-sm text-slate-600 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex gap-2">
                      <Check className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {plan.id === 'enterprise' ? (
                  <Button
                    variant="secondary"
                    onClick={() => window.location.assign('mailto:kontakt@gatesign.de?subject=Enterprise-Anfrage')}
                  >
                    Kontakt aufnehmen
                  </Button>
                ) : isCurrent ? (
                  <Button variant="secondary" disabled>
                    Aktueller Plan
                  </Button>
                ) : (
                  <Button
                    variant={plan.highlight ? 'primary' : 'secondary'}
                    onClick={() => handleChoose(plan.id)}
                    loading={loadingPlan === plan.id}
                    disabled={!stripeReady || loadingPlan !== null}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {state.hasActiveSubscription ? 'Wechseln' : 'Wählen'}
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Add-on-Marketplace */}
      <section>
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Add-ons</h3>
          <p className="text-sm text-slate-500">
            Funktionen für Ihren Plan dazubuchen. Abrechnung anteilig zu Ihrem aktuellen Zyklus.
          </p>
        </header>

        <div className="grid gap-3 md:grid-cols-2">
          {ALL_ADDON_KEYS.map(key => {
            const def = ADDON_REGISTRY[key]
            const isActive = state.activeAddons.includes(key)
            const isIncluded = def.includedIn.includes(state.plan)
            const isComingSoon = def.status === 'coming_soon'
            const isToggling = togglingAddon === key
            const cycle = state.cycle
            const price = cycle === 'yearly' ? def.pricing.yearly : def.pricing.monthly

            return (
              <div
                key={key}
                className={clsx(
                  'flex items-start gap-4 rounded-xl border bg-white p-4',
                  isActive || isIncluded ? 'border-slate-300' : 'border-slate-200',
                  isComingSoon && 'opacity-70',
                )}
              >
                <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
                  {ADDON_ICONS[key]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <h4 className="text-sm font-semibold text-slate-900">{def.label}</h4>
                    {isIncluded && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Inklusive
                      </span>
                    )}
                    {isComingSoon && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        <Clock className="w-3 h-3" />
                        Demnächst
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 leading-snug mb-2">{def.shortDescription}</p>
                  <p className="text-xs text-slate-600">
                    <span className="font-medium text-slate-900">{price} €</span>
                    <span className="text-slate-500"> {cycle === 'yearly' ? 'pro Jahr' : 'pro Monat'}</span>
                    {def.pricing.oneTimeHardware && (
                      <span className="text-slate-500"> · +{def.pricing.oneTimeHardware} € Hardware einmalig</span>
                    )}
                  </p>
                </div>
                <div className="shrink-0">
                  {isIncluded ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : isComingSoon ? (
                    <Button variant="ghost" size="sm" disabled>
                      Demnächst
                    </Button>
                  ) : (
                    <Button
                      variant={isActive ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleAddon(key, isActive)}
                      loading={isToggling}
                      disabled={!stripeReady || !state.hasActiveSubscription || togglingAddon !== null}
                      title={!state.hasActiveSubscription ? 'Zuerst einen Plan wählen' : undefined}
                    >
                      {isActive ? 'Entfernen' : 'Aktivieren'}
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {!state.hasActiveSubscription && (
          <p className="text-xs text-slate-400 mt-3">
            Hinweis: Add-ons sind erst nach Plan-Wahl buchbar.
          </p>
        )}
      </section>

      {/* Print-Bridge-Verwaltung — nur wenn Drucker-Add-on aktiv */}
      {state.activeAddons.includes('printer') && (
        <section>
          <header className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Drucker einrichten</h3>
            <p className="text-sm text-slate-500">
              Koppeln Sie den Besucherkarten-Drucker über die Print-Bridge auf Ihrem Terminal-Rechner.
            </p>
          </header>
          <PrintBridgeManager />
        </section>
      )}

      <p className="text-xs text-slate-400">
        Zahlungen werden sicher über Stripe abgewickelt. Sie können jederzeit über das Kundenportal kündigen.
      </p>
    </div>
  )
}

function CycleToggle({ value, onChange }: { value: BillingCycle; onChange: (c: BillingCycle) => void }) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={clsx(
          'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
          value === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
        )}
      >
        Monatlich
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={clsx(
          'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5',
          value === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700',
        )}
      >
        Jährlich
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700">−2 Monate</span>
      </button>
    </div>
  )
}
