/**
 * HTTP-Client gegen das GateSign-Backend.
 * Node 20+ hat `fetch` global — keine Extra-Dependency nötig.
 */

import type { BridgeConfig } from './config.ts'

export interface PairResponse {
  api_token: string
  bridge_id: string
  terminal_id: string
  company_id: string
}

export interface PrintJobPayload {
  id: string
  check_in_id: string
  png_base64: string
  pickup_token: string
}

export type JobStatusUpdate = 'printed' | 'failed' | 'paper_out'

/** Tauscht den Pairing-Code gegen einen API-Token. */
export async function pairBridge(opts: {
  baseUrl: string
  code: string
  printerTarget: string
  printerModel: string
}): Promise<PairResponse> {
  const res = await fetch(`${opts.baseUrl}/api/print-agent/pair`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: opts.code,
      printer_target: opts.printerTarget,
      printer_model: opts.printerModel,
    }),
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Pairing fehlgeschlagen (${res.status}): ${text}`)
  }
  return (await res.json()) as PairResponse
}

/**
 * Pollt den nächsten Druckjob. Gibt null zurück wenn keiner da ist (HTTP 204)
 * oder bei Auth-Failure (HTTP 401 — Caller muss neu pairen).
 */
export async function pollNextJob(cfg: BridgeConfig): Promise<PrintJobPayload | null | 'unauthorized'> {
  const res = await fetch(`${cfg.baseUrl}/api/print-agent/jobs`, {
    headers: { Authorization: `Bearer ${cfg.apiToken}` },
  })
  if (res.status === 204) return null
  if (res.status === 401) return 'unauthorized'
  if (!res.ok) {
    throw new Error(`Poll fehlgeschlagen (${res.status}): ${await res.text().catch(() => '')}`)
  }
  return (await res.json()) as PrintJobPayload
}

/** Meldet Job-Status zurück (printed/failed/paper_out). */
export async function reportStatus(opts: {
  cfg: BridgeConfig
  jobId: string
  pickupToken: string
  status: JobStatusUpdate
  errorMessage?: string
}): Promise<void> {
  const res = await fetch(`${opts.cfg.baseUrl}/api/print-agent/jobs/${opts.jobId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.cfg.apiToken}`,
    },
    body: JSON.stringify({
      pickup_token: opts.pickupToken,
      status: opts.status,
      error_message: opts.errorMessage,
    }),
  })
  if (!res.ok && res.status !== 204) {
    throw new Error(`Status-Report fehlgeschlagen (${res.status}): ${await res.text().catch(() => '')}`)
  }
}

/** Sendet Heartbeat mit optionalem Status-Update. */
export async function sendHeartbeat(opts: {
  cfg: BridgeConfig
  status?: 'online' | 'offline' | 'paper_out' | 'error'
  error?: string | null
}): Promise<void> {
  const body: Record<string, unknown> = {}
  if (opts.status) body.status = opts.status
  if (opts.error !== undefined) body.error = opts.error

  await fetch(`${opts.cfg.baseUrl}/api/print-agent/heartbeat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.cfg.apiToken}`,
    },
    body: JSON.stringify(body),
  }).catch(() => { /* Heartbeat-Failures sind nicht kritisch */ })
}
