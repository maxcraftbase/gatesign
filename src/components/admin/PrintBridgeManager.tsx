'use client'

/**
 * Verwaltung der Print-Bridge(s) im Billing-Bereich (Drucker-Add-on).
 *
 * Zeigt pro Terminal eine Status-Card: Online/Offline, Drucker-Ziel/-Modell,
 * letzter Kontakt. Über „Koppeln" wird ein 8-stelliger Pairing-Code erzeugt,
 * den der Kunde auf dem Terminal-Rechner in die Bridge eintippt.
 *
 * Self-fetching: lädt GET /api/admin/print-bridge beim Mount + alle 10 s.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Printer, Wifi, WifiOff, AlertTriangle, KeyRound, Copy, Check,
  RefreshCw, Clock, Server,
} from 'lucide-react'
import { clsx } from 'clsx'

type BridgeStatus = 'offline' | 'online' | 'paper_out' | 'error'

interface BridgeInfo {
  id: string
  paired: boolean
  status: BridgeStatus
  last_seen: string | null
  last_error: string | null
  printer_target: string | null
  printer_model: string | null
  pairing_active: boolean
  pairing_expires_at: string | null
}

interface TerminalBridge {
  terminal_id: string
  terminal_name: string
  bridge: BridgeInfo | null
}

/** Eine Bridge gilt als „live", wenn sie sich in den letzten 30 s gemeldet hat. */
function isLive(lastSeen: string | null): boolean {
  if (!lastSeen) return false
  return Date.now() - new Date(lastSeen).getTime() < 30_000
}

function relativeTime(iso: string | null): string {
  if (!iso) return 'nie'
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 5) return 'gerade eben'
  if (seconds < 60) return `vor ${seconds} s`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `vor ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `vor ${hours} h`
  return `vor ${Math.floor(hours / 24)} Tagen`
}

/** Verbleibende Zeit bis Code-Ablauf als „m:ss" oder null wenn abgelaufen. */
function countdown(iso: string | null): string | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  if (ms <= 0) return null
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface StatusPill {
  label: string
  tone: 'positive' | 'neutral' | 'warning' | 'danger'
  icon: React.ReactNode
}

function deriveStatus(bridge: BridgeInfo | null): StatusPill {
  if (!bridge || !bridge.paired) {
    return { label: 'Nicht gekoppelt', tone: 'neutral', icon: <WifiOff className="w-3.5 h-3.5" strokeWidth={2} /> }
  }
  if (bridge.status === 'paper_out') {
    return { label: 'Kein Papier', tone: 'warning', icon: <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} /> }
  }
  if (bridge.status === 'error') {
    return { label: 'Fehler', tone: 'danger', icon: <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} /> }
  }
  if (isLive(bridge.last_seen)) {
    return { label: 'Online', tone: 'positive', icon: <Wifi className="w-3.5 h-3.5" strokeWidth={2} /> }
  }
  return { label: 'Offline', tone: 'neutral', icon: <WifiOff className="w-3.5 h-3.5" strokeWidth={2} /> }
}

const TONE_CLASSES: Record<StatusPill['tone'], string> = {
  positive: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  neutral:  'border-slate-200 bg-slate-50 text-slate-600',
  warning:  'border-amber-200 bg-amber-50 text-amber-700',
  danger:   'border-rose-200 bg-rose-50 text-rose-700',
}

export function PrintBridgeManager() {
  const [terminals, setTerminals] = useState<TerminalBridge[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pairing, setPairing] = useState<Record<string, { code: string; expiresAt: string }>>({})
  const [pairingLoading, setPairingLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [, setTick] = useState(0)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/print-bridge', { cache: 'no-store' })
      if (!res.ok) throw new Error('load failed')
      const data = await res.json()
      setTerminals(data.terminals ?? [])
      setError(null)
    } catch {
      setError('Bridge-Status konnte nicht geladen werden.')
    }
  }, [])

  // Initialer Load + Status-Refresh alle 10 s. Der erste Aufruf läuft über
  // setTimeout(0), damit setState nicht synchron im Effekt-Body passiert
  // (react-hooks/set-state-in-effect, sonst killt Railway den Build).
  useEffect(() => {
    const initial = setTimeout(load, 0)
    const id = setInterval(load, 10_000)
    return () => { clearTimeout(initial); clearInterval(id) }
  }, [load])

  // „vor X s" / Countdown live halten
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  async function handlePair(terminalId: string) {
    setPairingLoading(terminalId)
    setError(null)
    try {
      const res = await fetch('/api/admin/print-bridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terminal_id: terminalId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Pairing fehlgeschlagen')
      setPairing(prev => ({ ...prev, [terminalId]: { code: data.pairing_code, expiresAt: data.expires_at } }))
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Pairing fehlgeschlagen')
    } finally {
      setPairingLoading(null)
    }
  }

  async function copyCode(terminalId: string, code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(terminalId)
      setTimeout(() => setCopied(c => (c === terminalId ? null : c)), 2000)
    } catch { /* Clipboard nicht verfügbar — Code ist trotzdem sichtbar */ }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <header className="flex items-start justify-between gap-4 mb-5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-center text-slate-700 shrink-0">
            <Printer className="w-5 h-5" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Print-Bridge</h3>
            <p className="text-sm text-slate-500">
              Verbindet Ihren Besucherkarten-Drucker mit GateSign. Pro Terminal eine Bridge.
            </p>
          </div>
        </div>
        <button
          onClick={load}
          className="flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-colors shrink-0"
          title="Status aktualisieren"
        >
          <RefreshCw className="w-4 h-4" strokeWidth={2} />
        </button>
      </header>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 mb-4">
          {error}
        </div>
      )}

      {terminals === null ? (
        <div className="flex items-center justify-center py-10">
          <div className="w-6 h-6 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
        </div>
      ) : terminals.length === 0 ? (
        <p className="text-sm text-slate-500 py-6 text-center">Keine aktiven Terminals vorhanden.</p>
      ) : (
        <div className="space-y-3">
          {terminals.map(t => {
            const pill = deriveStatus(t.bridge)
            const fresh = pairing[t.terminal_id]
            const freshCountdown = fresh ? countdown(fresh.expiresAt) : null
            const showCode = fresh && freshCountdown !== null
            const isPaired = Boolean(t.bridge?.paired)

            return (
              <div key={t.terminal_id} className="rounded-xl border border-slate-200 p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-900 text-sm">{t.terminal_name}</span>
                      <span className={clsx(
                        'inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border',
                        TONE_CLASSES[pill.tone],
                      )}>
                        {pill.icon}
                        {pill.label}
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-x-4 gap-y-1 flex-wrap text-xs text-slate-500">
                      {isPaired && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" strokeWidth={1.75} />
                          Letzter Kontakt {relativeTime(t.bridge?.last_seen ?? null)}
                        </span>
                      )}
                      {t.bridge?.printer_target && (
                        <span className="inline-flex items-center gap-1">
                          <Server className="w-3.5 h-3.5" strokeWidth={1.75} />
                          <span className="font-mono">{t.bridge.printer_target}</span>
                          {t.bridge.printer_model && <span className="text-slate-400">· {t.bridge.printer_model}</span>}
                        </span>
                      )}
                      {!isPaired && !showCode && (
                        <span className="text-slate-400">Noch nicht mit einem Drucker verbunden.</span>
                      )}
                    </div>
                    {t.bridge?.status === 'error' && t.bridge.last_error && (
                      <p className="mt-1.5 text-xs text-rose-600">{t.bridge.last_error}</p>
                    )}
                  </div>

                  <button
                    onClick={() => handlePair(t.terminal_id)}
                    disabled={pairingLoading === t.terminal_id}
                    className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold px-3.5 py-2 rounded-lg border border-slate-200 text-slate-700 hover:border-slate-400 hover:bg-slate-50 transition-colors disabled:opacity-50 shrink-0 whitespace-nowrap"
                  >
                    <KeyRound className="w-4 h-4" strokeWidth={2} />
                    {pairingLoading === t.terminal_id
                      ? 'Code wird erzeugt…'
                      : isPaired ? 'Neu koppeln' : 'Koppeln'}
                  </button>
                </div>

                {/* Pairing-Code-Box */}
                {showCode && (
                  <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/60 p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-500 mb-1.5">
                          Pairing-Code
                        </p>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-2xl font-bold tracking-[0.3em] text-slate-900">
                            {fresh!.code}
                          </span>
                          <button
                            onClick={() => copyCode(t.terminal_id, fresh!.code)}
                            className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-100 transition-colors"
                          >
                            {copied === t.terminal_id
                              ? <><Check className="w-3.5 h-3.5" strokeWidth={2.5} />Kopiert</>
                              : <><Copy className="w-3.5 h-3.5" strokeWidth={2} />Kopieren</>}
                          </button>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 bg-white border border-indigo-200 px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5" strokeWidth={2} />
                        Gültig {freshCountdown}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-slate-600 leading-relaxed">
                      Starten Sie die Print-Bridge auf dem Terminal-Rechner und geben Sie diesen Code ein.
                      Der Code ist 10 Minuten gültig und kann nur einmal verwendet werden.
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
