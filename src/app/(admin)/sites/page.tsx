import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { NewSiteForm } from './NewSiteForm'
import { QrCode, FileText, List } from 'lucide-react'

export default async function SitesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: sites } = await supabase
    .from('sites')
    .select('*')
    .eq('company_id', company?.id)
    .order('created_at', { ascending: false })

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Standorte</h1>
      </div>

      <Card>
        <h2 className="font-semibold text-slate-900 mb-4">Neuen Standort anlegen</h2>
        <NewSiteForm companyId={company?.id ?? ''} />
      </Card>

      {sites && sites.length > 0 && (
        <div className="flex flex-col gap-3">
          {sites.map(site => (
            <Card key={site.id} className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{site.name}</p>
                {site.address && <p className="text-sm text-slate-500">{site.address}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/sites/${site.id}/qr`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-900 text-white hover:bg-slate-700 transition-colors"
                >
                  <QrCode size={15} />
                  QR-Code
                </Link>
                <Link
                  href={`/sites/${site.id}/briefing`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <FileText size={15} />
                  Belehrung
                </Link>
                <Link
                  href={`/sites/${site.id}/log`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  <List size={15} />
                  Nachweise
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
