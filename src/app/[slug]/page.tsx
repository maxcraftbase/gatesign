import { notFound, redirect } from 'next/navigation'
import { getCompanyBySlug, getFirstTerminal } from '@/lib/company'

export default async function CompanyIndexPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const company = await getCompanyBySlug(slug)
  if (!company) notFound()

  const terminal = await getFirstTerminal(company.id)
  if (!terminal) {
    // Company exists but has no terminal yet — show a friendly error
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <p className="text-slate-500 text-lg">Kein Terminal konfiguriert.</p>
          <p className="text-slate-400 text-sm mt-2">Bitte im Admin-Bereich ein Terminal anlegen.</p>
        </div>
      </div>
    )
  }

  redirect(`/${slug}/${terminal.slug}`)
}
