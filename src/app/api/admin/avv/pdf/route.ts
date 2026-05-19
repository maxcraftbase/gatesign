import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { getCompanyAvvState } from '@/lib/avv-storage'
import { buildAvvPdf } from '@/lib/avv-pdf'

export async function GET() {
  const ctx = await getAdminContext()
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = await getCompanyAvvState(ctx.company.id)
  if (!state?.avv_signed_at || !state.avv_signature_data) {
    return NextResponse.json({ error: 'AVV noch nicht unterzeichnet.' }, { status: 404 })
  }

  const pdf = await buildAvvPdf({
    companyName: state.name,
    companyAddress: state.avv_company_address ?? '',
    companyRegisterNo: state.avv_company_register_no ?? undefined,
    signerName: state.avv_signer_name ?? '',
    signerRole: state.avv_signer_role ?? '',
    signedAt: new Date(state.avv_signed_at),
    signatureDataUrl: state.avv_signature_data,
    ip: state.avv_signature_ip ?? undefined,
    userAgent: state.avv_signature_user_agent ?? undefined,
  })

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="AVV-GateSign-${state.slug}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
