import { AdminNav } from '@/components/admin/AdminNav'
import { ExitFullscreen } from '@/components/admin/ExitFullscreen'

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return (
    <div className="min-h-screen bg-slate-50">
      <ExitFullscreen />
      <AdminNav slug={slug} />
      <main className="max-w-6xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
