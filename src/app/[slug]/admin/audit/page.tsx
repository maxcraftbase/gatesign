import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AuditClient } from '@/app/admin/audit/audit-client'

export default async function AuditPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('.')
  return <AuditClient />
}
