import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { DocumentsClient } from '@/app/admin/documents/documents-client'
import { SettingsSubNav } from '@/components/admin/SettingsSubNav'

export default async function DocumentsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect('/login')
  if (ctx.role !== 'admin') redirect('.')
  return (
    <>
      <SettingsSubNav slug={slug} />
      <DocumentsClient />
    </>
  )
}
