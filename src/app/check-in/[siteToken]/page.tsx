import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { CheckInClient } from './CheckInClient'

export default async function CheckInPage({ params }: { params: Promise<{ siteToken: string }> }) {
  const { siteToken } = await params
  const supabase = await createClient()

  const { data: site } = await supabase
    .from('sites')
    .select('id, name, companies(name)')
    .eq('qr_token', siteToken)
    .single()

  if (!site) notFound()

  const { data: briefing } = await supabase
    .from('safety_briefings')
    .select('id, version, briefing_translations(language, content)')
    .eq('site_id', site.id)
    .eq('is_active', true)
    .single()

  return (
    <CheckInClient
      site={{ id: site.id, name: site.name, companyName: (site.companies as unknown as { name: string } | null)?.name ?? '' }}
      briefing={briefing ?? null}
    />
  )
}
