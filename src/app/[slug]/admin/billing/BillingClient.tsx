'use client'

import { useState } from 'react'
import { Check, CreditCard, ExternalLink, AlertCircle, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { Button } from '@/components/ui/Button'

type PlanName = 'starter' | 'professional' | 'enterprise'

export interface BillingCompanyState {
  plan: PlanName
  subscriptionStatus: string
  trialEndsAt: string | null
  currentPeriodEnd: string | null
  hasStripeCustomer: boolean
  hasActiveSubscription: boolean
}

interface PlanDef {
  id: PlanName
  name: string
  price: string
  priceNote: string
  features: string[]
  highlight?: boolean
}

const PLANS: PlanDef[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: '49 €',
    priceNote: 'pro Monat',
    features: ['1 Terminal', 'Mehrsprachige Check-ins', 'Tägliche Anwesenheits-Digests', 'Audit-Protokoll'],
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '99 €',
    priceNote: 'pro Monat',
    features: ['3 Terminals', 'Alles aus Starter', 'Mehrere Standorte', 'Vorrangiger Support'],
    highlight: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Auf Anfrage',
    priceNote: 'individuelle Konditionen',
    features: ['Unbegrenzte Terminals', 'Eigene Onboarding-Begleitung', 'Vertraglich vereinbarte SLAs', 'Individuelle Integrationen'],
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
  const [loadingPlan, setLoadingPlan] = useState<PlanName | null>(null)
  const [portalLoading, setPortalLoading] = useState(false)
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
        body: JSON.stringify({ plan }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.url) {
        throw new Error(data.error || 'Checkout konnte nicht gestartet werden.')
      }
      window.location.href = data.url
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
      window.location.href = data.url
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler.')
      setPortalLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Banner */}
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
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 capitalize">{PLANS.find(p => p.id === state.plan)?.name ?? state.plan}</h2>
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
            </div>
            <p className="text-sm text-slate-500 mt-2">
              {isOnTrial && trialDate ? (
                <>
                  Trial läuft noch <strong className="text-slate-700">{trialDays ?? 0} {trialDays === 1 ? 'Tag' : 'Tage'}</strong>{' '}
                  (bis {trialDate})
                </>
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

      {/* Plan-Vergleich */}
      <section>
        <header className="mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Plan wechseln</h3>
          <p className="text-sm text-slate-500">Sie können jederzeit upgraden oder downgraden. Abrechnung erfolgt anteilig.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map(plan => {
            const isCurrent = plan.id === state.plan && state.hasActiveSubscription
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
                  <span className="text-2xl font-bold text-slate-900">{plan.price}</span>
                  <span className="text-sm text-slate-500 ml-1">{plan.priceNote}</span>
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
                    onClick={() => window.location.href = 'mailto:kontakt@gatesign.de?subject=Enterprise-Anfrage'}
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
                    Wählen
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Zahlungen werden sicher über Stripe abgewickelt. Sie können jederzeit über das Kundenportal kündigen.
      </p>
    </div>
  )
}
