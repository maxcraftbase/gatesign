import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { QRCodeDisplay } from './QRCodeDisplay'

export default async function QRPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: site } = await supabase
    .from('sites')
    .select('*, companies!inner(user_id)')
    .eq('id', id)
    .eq('companies.user_id', user.id)
    .single()

  if (!site) notFound()

  const checkInUrl = `${process.env.NEXT_PUBLIC_APP_URL}/check-in/${site.qr_token}`

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">QR-Code</h1>
        <p className="text-slate-500 mt-1">{site.name}</p>
      </div>

      <QRCodeDisplay url={checkInUrl} siteName={site.name} />

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
        <p className="font-medium mb-1">So funktioniert es:</p>
        <p>Drucken Sie diesen QR-Code aus und hängen Sie ihn gut sichtbar am Eingang auf. Fahrer scannen den Code mit dem Handy und melden sich in Sekunden an — ohne App-Installation.</p>
      </div>
    </div>
  )
}
