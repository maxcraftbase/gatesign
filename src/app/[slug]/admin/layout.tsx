import { redirect } from 'next/navigation'
import { getAdminContext } from '@/lib/admin-auth'
import { AdminNav } from '@/components/admin/AdminNav'
import { ExitFullscreen } from '@/components/admin/ExitFullscreen'
import { listTerminals } from '@/lib/company'

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

  const terminals = await listTerminals(ctx.company.id)

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <ExitFullscreen />
      <AdminNav slug={slug} role={ctx.role} userName={ctx.name} companyName={ctx.company.name} terminals={terminals} />
      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white py-3 px-6 text-center text-xs text-slate-400">
        GateSign &middot;{' '}
        <a href="/datenschutz" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Datenschutz</a>
        {' '}&middot;{' '}
        <a href="/impressum" target="_blank" rel="noopener noreferrer" className="hover:text-slate-600 underline">Impressum</a>
      </footer>
    </div>
  )
}
