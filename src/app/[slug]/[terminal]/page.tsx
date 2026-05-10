import { KioskClient } from '@/app/kiosk-client'
import { notFound } from 'next/navigation'
import { getCompanyBySlug, getTerminalBySlug } from '@/lib/company'

export default async function TerminalKioskPage({ params }: { params: Promise<{ slug: string; terminal: string }> }) {
  const { slug, terminal: terminalSlug } = await params

  // Guard: 'admin' is a reserved segment handled by [slug]/admin/
  if (terminalSlug === 'admin') notFound()

  const company = await getCompanyBySlug(slug)
  if (!company) notFound()

  const terminal = await getTerminalBySlug(company.id, terminalSlug)
  if (!terminal) notFound()

  return <KioskClient slug={slug} terminalSlug={terminalSlug} terminalName={terminal.name} />
}
