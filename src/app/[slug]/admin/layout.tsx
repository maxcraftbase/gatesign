import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AdminNav } from '@/components/admin/AdminNav'
import { ExitFullscreen } from '@/components/admin/ExitFullscreen'
import { AvvBanner } from '@/components/admin/AvvBanner'
import { listTerminals } from '@/lib/company'
import { getCompanyAvvState } from '@/lib/avv-storage'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const ctx = await getAdminContext()
  if (!ctx) redirect(`/${slug}/admin/login`)

  const [terminals, avvState] = await Promise.all([
    listTerminals(ctx.company.id),
    getCompanyAvvState(ctx.company.id),
  ])
  const avvMissing = !avvState?.avv_signed_at

  return (
    <div className="min-h-screen bg-slate-50">
      <ExitFullscreen />
      <AdminNav slug={slug} role={ctx.role} userName={ctx.name} companyName={ctx.company.name} terminals={terminals} />
      {avvMissing && <AvvBanner slug={slug} />}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
