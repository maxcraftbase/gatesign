import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { SubscribeButton } from './SubscribeButton'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ subscribed?: string }>
}) {
  const { subscribed } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*, sites(id)')
    .eq('user_id', user.id)
    .single()

  const { data: recentCheckIns } = await supabase
    .from('check_ins')
    .select('*, sites!inner(company_id)')
    .eq('sites.company_id', company?.id)
    .order('timestamp', { ascending: false })
    .limit(5)

  const siteCount = company?.sites?.length ?? 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Willkommen, {company?.name}
        </h1>
        <p className="text-slate-500 mt-1">Ihr GateSign-Überblick</p>
      </div>

      {subscribed === '1' && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 text-green-800 font-medium">
          Ihr Abonnement ist aktiv — GateSign ist einsatzbereit.
        </div>
      )}

      {!company?.subscription_active && (
        <Card className="bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-amber-900">Testphase — noch kein Abo aktiv</p>
              <p className="text-sm text-amber-700 mt-0.5">Alle Features verfügbar, Abo für den Produktivbetrieb erforderlich.</p>
            </div>
            <SubscribeButton />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-slate-500">Aktive Standorte</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{siteCount}</p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Check-ins heute</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">
            {recentCheckIns?.filter(c =>
              new Date(c.timestamp).toDateString() === new Date().toDateString()
            ).length ?? 0}
          </p>
        </Card>
        <Card>
          <p className="text-sm text-slate-500">Abo-Status</p>
          <p className={`text-lg font-bold mt-1 ${company?.subscription_active ? 'text-green-600' : 'text-amber-600'}`}>
            {company?.subscription_active ? 'Aktiv' : 'Testphase'}
          </p>
        </Card>
      </div>

      {siteCount === 0 ? (
        <Card className="text-center py-12">
          <p className="text-slate-500 mb-4">Noch kein Standort angelegt.</p>
          <Link
            href="/sites"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-700 transition-colors"
          >
            Ersten Standort anlegen
          </Link>
        </Card>
      ) : (
        <Card>
          <h2 className="font-semibold text-slate-900 mb-4">Letzte Check-ins</h2>
          {recentCheckIns && recentCheckIns.length > 0 ? (
            <div className="flex flex-col gap-2">
              {recentCheckIns.map(c => (
                <div key={c.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="font-medium text-slate-900 text-sm">{c.driver_name}</p>
                    <p className="text-xs text-slate-500">
                      {c.driver_company} · {c.license_plate}
                      {c.trailer_plate ? ` · ${c.trailer_plate}` : ''}
                      {c.reference_number ? ` · Ref: ${c.reference_number}` : ''}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">
                    {new Date(c.timestamp).toLocaleString('de-DE', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 text-sm">Noch keine Check-ins.</p>
          )}
        </Card>
      )}
    </div>
  )
}
