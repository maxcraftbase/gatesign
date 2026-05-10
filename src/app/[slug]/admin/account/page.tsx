import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { SettingsSubNav } from '@/components/admin/SettingsSubNav'
import { AccountClient } from '@/app/admin/account-client'

export default async function AccountPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect(`/${slug}/admin/login`)

  return (
    <>
      <SettingsSubNav slug={slug} />
      <AccountClient />
    </>
  )
}
