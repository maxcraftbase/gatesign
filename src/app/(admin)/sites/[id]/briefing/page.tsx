import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { BriefingEditor } from './BriefingEditor'
import { SUPPORTED_LANGUAGES } from '@/types'

export default async function BriefingPage({ params }: { params: Promise<{ id: string }> }) {
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

  const { data: briefing } = await supabase
    .from('safety_briefings')
    .select('*, briefing_translations(*)')
    .eq('site_id', id)
    .eq('is_active', true)
    .single()

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Sicherheitsbelehrung</h1>
        <p className="text-slate-500 mt-1">{site.name}</p>
        {briefing && (
          <p className="text-xs text-slate-400 mt-1">Aktuelle Version: {briefing.version}</p>
        )}
      </div>

      <BriefingEditor
        siteId={id}
        existingBriefing={briefing}
        languages={SUPPORTED_LANGUAGES}
      />
    </div>
  )
}
