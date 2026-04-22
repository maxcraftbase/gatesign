import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { LogTable } from './LogTable'

export default async function LogPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: checkIns } = await supabase
    .from('check_ins')
    .select('*')
    .eq('site_id', id)
    .order('timestamp', { ascending: false })
    .limit(500)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Nachweisliste</h1>
        <p className="text-slate-500 mt-1">{site.name}</p>
      </div>

      <LogTable checkIns={checkIns ?? []} siteName={site.name} />
    </div>
  )
}
