import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AuditClient } from '@/app/admin/audit/audit-client'
import { SettingsSubNav } from '@/components/admin/SettingsSubNav'

export default async function AuditPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('.')
  return (
    <>
      <SettingsSubNav slug={slug} />
      <AuditClient />
    </>
  )
}
