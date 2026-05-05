import type { ComplianceResult, WeeklyResult } from './types'

function fmt(iso: string) {
  if (!iso) return '—'
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
  } catch { return iso }
}

const BASE = `
  <style>*{box-sizing:border-box;margin:0;padding:0}</style>
  <body style="background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;padding:32px 16px;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">
`
const FOOTER = `
  <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
    <p style="font-size:12px;color:#94a3b8;">Automatisch generiert von GateSign</p>
  </div></div></body>
`

export function complianceEmailHtml(companyName: string, result: ComplianceResult): string {
  const hasIssues = result.issues.length > 0
  const accent = hasIssues ? '#dc2626' : '#059669'
  const bg = hasIssues ? '#fef2f2' : '#f0fdf4'
  const statusText = hasIssues
    ? `${result.issues.length} Auffälligkeit${result.issues.length !== 1 ? 'en' : ''} gefunden`
    : 'Alles in Ordnung'

  const rows = result.issues.map(i => `
    <tr>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:14px;color:#1e293b;">${i.driver}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;font-family:monospace;color:#475569;">${i.plate}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:13px;color:#dc2626;">${i.issue}</td>
      <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-size:12px;color:#94a3b8;">${fmt(i.time)}</td>
    </tr>`).join('')

  return `<!DOCTYPE html><html>${BASE}
    <div style="background:#0f172a;padding:24px 32px;">
      <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">GateSign · Compliance-Check</p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;">${companyName}</h1>
    </div>
    <div style="padding:28px 32px;">
      <div style="background:${bg};border-left:4px solid ${accent};padding:14px 18px;border-radius:6px;margin-bottom:24px;">
        <p style="font-weight:600;color:${accent};font-size:15px;">${statusText}</p>
        <p style="color:#64748b;font-size:13px;margin-top:4px;">${result.checked} Check-ins geprüft · ${result.period}</p>
      </div>
      ${hasIssues ? `
      <h2 style="font-size:14px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:12px;">Auffälligkeiten</h2>
      <table style="width:100%;border-collapse:collapse;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
        <thead><tr style="background:#f8fafc;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Fahrer</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Kennzeichen</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Problem</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.05em;">Zeit</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>` : `<p style="color:#64748b;font-size:14px;line-height:1.6;">Alle Check-ins wurden korrekt erfasst. Keine Auffälligkeiten.</p>`}
    </div>
    ${FOOTER}</html>`
}

export function weeklyEmailHtml(companyName: string, result: WeeklyResult): string {
  const typeLabels: Record<string, string> = { truck: 'LKW', visitor: 'Besucher', service: 'Service' }

  const typeRows = Object.entries(result.by_type).map(([type, count]) => `
    <div style="display:flex;justify-content:space-between;padding:9px 0;border-bottom:1px solid #f1f5f9;">
      <span style="color:#475569;font-size:14px;">${typeLabels[type] ?? type}</span>
      <strong style="font-size:14px;color:#1e293b;">${count}</strong>
    </div>`).join('')

  const companyRows = result.top_companies.map((c, i) => `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:9px 0;border-bottom:1px solid #f1f5f9;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:22px;height:22px;background:#e2e8f0;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:#475569;flex-shrink:0;">${i + 1}</span>
        <span style="color:#475569;font-size:14px;">${c.name}</span>
      </div>
      <strong style="font-size:14px;color:#1e293b;">${c.count}×</strong>
    </div>`).join('')

  return `<!DOCTYPE html><html>${BASE}
    <div style="background:#0f172a;padding:24px 32px;">
      <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">GateSign · Wochenanalyse</p>
      <h1 style="color:#fff;font-size:20px;font-weight:700;">${companyName}</h1>
    </div>
    <div style="padding:28px 32px;">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:28px;">
        <div style="background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:30px;font-weight:700;color:#1e293b;">${result.checked}</p>
          <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px;">Check-ins</p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:30px;font-weight:700;color:#1e293b;">Ø ${result.per_day_avg}</p>
          <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px;">Pro Tag</p>
        </div>
        <div style="background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
          <p style="font-size:30px;font-weight:700;color:#1e293b;">${result.signature_rate}%</p>
          <p style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:.05em;margin-top:4px;">Unterschrieben</p>
        </div>
      </div>

      <div style="background:#eff6ff;border-radius:8px;padding:14px 18px;margin-bottom:24px;">
        <p style="font-size:14px;color:#1d4ed8;">Peak-Zeit: <strong>${result.peak_hour}</strong></p>
      </div>

      ${Object.keys(result.by_type).length ? `
      <h2 style="font-size:14px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Besuchertypen</h2>
      <div style="margin-bottom:24px;">${typeRows}</div>` : ''}

      ${result.top_companies.length ? `
      <h2 style="font-size:14px;font-weight:700;color:#1e293b;text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px;">Top-Firmen</h2>
      <div>${companyRows}</div>` : ''}
    </div>
    ${FOOTER}</html>`
}
