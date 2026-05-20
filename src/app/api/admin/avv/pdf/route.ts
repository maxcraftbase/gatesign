import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { getCompanyAvvState } from '@/lib/avv-storage'
import { buildAvvPdf } from '@/lib/avv-pdf'
import { AVV_VERSION } from '@/lib/avv-content'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = await getCompanyAvvState(ctx.company.id)
  if (!state?.avv_signed_at) {
    return NextResponse.json({ error: 'AVV noch nicht angenommen.' }, { status: 404 })
  }

  const pdf = await buildAvvPdf({
    companyName: state.name || ctx.company.name,
    acceptedAt: new Date(state.avv_signed_at),
    avvVersion: state.avv_version ?? AVV_VERSION,
    acceptedByEmail: ctx.email,
    ip: state.avv_signature_ip ?? undefined,
    userAgent: state.avv_signature_user_agent ?? undefined,
  })

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="AVV-GateSign-${state.slug || ctx.company.slug}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
