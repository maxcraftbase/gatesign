import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { getCompanyAvvState } from '@/lib/avv-storage'
import { AVV_VERSION, AVV_DATE, AvvDocument } from '@/lib/avv-content'
import { SettingsShell } from '@/components/admin/SettingsShell'
import { AvvSignClient } from './avv-sign-client'

export default async function AdminAvvPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect(`/${slug}/admin/login`)

  if (ctx.role !== 'admin') {
    return (
      <SettingsShell slug={slug}>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 max-w-2xl">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Nur für Administratoren</h1>
          <p className="text-sm text-slate-600">
            Der Auftragsverarbeitungsvertrag (AVV) kann nur von Administratoren des Unternehmens-Accounts angenommen werden.
            Bitte wenden Sie sich an Ihren Administrator.
          </p>
        </div>
      </SettingsShell>
    )
  }

  const state = await getCompanyAvvState(ctx.company.id)
  const isAccepted = !!state?.avv_signed_at

  if (isAccepted && state) {
    const controller = { companyName: state.name }
    const acceptedAt = new Date(state.avv_signed_at!)
    return (
      <SettingsShell slug={slug}>
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Auftragsverarbeitungsvertrag (AVV)</h1>
          <p className="text-sm text-slate-500 mb-6">Art. 28 DSGVO · Version {state.avv_version ?? AVV_VERSION} · Stand {AVV_DATE}</p>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 mb-6 flex items-start gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <div className="text-sm">
              <p className="font-semibold text-emerald-900">AVV angenommen</p>
              <p className="text-emerald-800 mt-0.5">
                Click-Wrap-Annahme am{' '}
                <strong>{acceptedAt.toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })} Uhr</strong>.
                Eine signierte PDF-Fassung mit Annahme-Nachweis steht jederzeit zum Download bereit.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mb-8">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/api/admin/avv/pdf"
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              PDF herunterladen
            </a>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <AvvDocument controller={controller} />
          </div>
        </div>
      </SettingsShell>
    )
  }

  return (
    <SettingsShell slug={slug}>
      <AvvSignClient
        slug={slug}
        defaultCompanyName={ctx.company.name}
        adminEmail={ctx.email}
      />
    </SettingsShell>
  )
}
