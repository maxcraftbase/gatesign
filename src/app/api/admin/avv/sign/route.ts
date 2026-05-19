import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { saveAvvSignature } from '@/lib/avv-storage'
import { logAction } from '@/lib/audit'
import { sendEmail } from '@/lib/brevo'
import { buildAvvPdf } from '@/lib/avv-pdf'

export async function POST(req: NextRequest) {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (ctx.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => null) as null | {
    companyAddress?: string
    companyRegisterNo?: string | null
    signerName?: string
    signerRole?: string
    avvVersion?: string
    signatureData?: string
  }

  if (!body) return NextResponse.json({ error: 'Ungültige Eingabe.' }, { status: 400 })
  const { companyAddress, companyRegisterNo, signerName, signerRole, avvVersion, signatureData } = body

  if (!companyAddress || !signerName || !signerRole) {
    return NextResponse.json({ error: 'Firmenanschrift und Daten der unterzeichnenden Person sind erforderlich.' }, { status: 400 })
  }
  if (!avvVersion) {
    return NextResponse.json({ error: 'AVV-Version fehlt.' }, { status: 400 })
  }
  if (!signatureData || !signatureData.startsWith('data:image/png;base64,')) {
    return NextResponse.json({ error: 'Gültige Signatur erforderlich.' }, { status: 400 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim()
    ?? req.headers.get('x-real-ip')
    ?? null
  const userAgent = req.headers.get('user-agent') ?? null

  const ok = await saveAvvSignature({
    companyId: ctx.company.id,
    signerName,
    signerRole,
    companyAddress,
    companyRegisterNo: companyRegisterNo ?? null,
    avvVersion,
    signatureData,
    ip,
    userAgent,
  })
  if (!ok) return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 })

  await logAction(ctx, 'avv_signed', { version: avvVersion, signer: signerName, role: signerRole, ip })

  // Best-effort: send confirmation email with PDF
  try {
    const signedAt = new Date()
    const pdfBuffer = await buildAvvPdf({
      companyName: ctx.company.name,
      companyAddress,
      companyRegisterNo: companyRegisterNo ?? undefined,
      signerName,
      signerRole,
      signedAt,
      signatureDataUrl: signatureData,
      ip: ip ?? undefined,
      userAgent: userAgent ?? undefined,
    })
    await sendEmail({
      to: ctx.email,
      subject: `AVV unterzeichnet — ${ctx.company.name}`,
      html: confirmationHtml(ctx.company.name, signerName, signerRole, signedAt),
      attachments: [{ name: `AVV-GateSign-${ctx.company.slug}.pdf`, content: pdfBuffer }],
    })
  } catch (e) {
    console.error('[avv/sign] email/pdf failed:', e)
  }

  return NextResponse.json({ success: true })
}

function confirmationHtml(companyName: string, signerName: string, signerRole: string, signedAt: Date) {
  const time = signedAt.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:system-ui,-apple-system,sans-serif;color:#0f172a">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden">
    <div style="background:#0f172a;padding:28px 32px">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700">GateSign</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">Auftragsverarbeitungsvertrag unterzeichnet</p>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 8px;font-size:18px">Bestätigung der Unterzeichnung</h2>
      <p style="color:#475569;font-size:14px;margin:0 0 16px">
        Der Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO wurde für <strong>${companyName}</strong> erfolgreich unterzeichnet.
      </p>
      <div style="background:#f8fafc;border-radius:8px;padding:16px 20px;margin-bottom:24px;font-size:13px;color:#475569">
        <p style="margin:0"><strong style="color:#0f172a">Unterzeichnet durch:</strong> ${signerName} (${signerRole})</p>
        <p style="margin:6px 0 0"><strong style="color:#0f172a">Zeitpunkt:</strong> ${time} Uhr</p>
      </div>
      <p style="color:#475569;font-size:13px;margin:0">
        Die signierte PDF-Fassung des Vertrags finden Sie im Anhang dieser E-Mail.
        Sie ist außerdem jederzeit im Admin-Bereich unter „AVV" zum Download verfügbar.
      </p>
    </div>
    <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
      <p style="margin:0;color:#94a3b8;font-size:11px">GateSign · Bei Fragen: info@alpha-consult.one</p>
    </div>
  </div>
</body></html>`
}
