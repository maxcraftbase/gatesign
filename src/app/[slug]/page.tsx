import { KioskClient } from '@/app/kiosk-client'
import { notFound } from 'next/navigation'
import { getCompanyBySlug } from '@/lib/company'

export default async function KioskPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const company = await getCompanyBySlug(slug)
  if (!company) notFound()
  return <KioskClient slug={slug} />
}
