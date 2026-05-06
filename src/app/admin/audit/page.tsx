import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AuditClient } from './audit-client'

export default async function AuditPage() {
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('/admin')
  return <AuditClient />
}
