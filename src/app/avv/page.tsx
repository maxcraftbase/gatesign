import Link from 'next/link'
import { AvvDocument, AVV_VERSION, AVV_DATE } from '@/lib/avv-content'

export const metadata = {
  title: 'AVV — Auftragsverarbeitungsvertrag · GateSign',
  description: 'Auftragsverarbeitungsvertrag nach Art. 28 DSGVO zwischen GateSign und Kundenunternehmen.',
}

export default function AvvPage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-slate-100 h-14 flex items-center px-6">
        <Link href="/" className="text-lg font-bold text-slate-900 hover:opacity-70 transition-opacity">GateSign</Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Auftragsverarbeitungsvertrag (AVV)</h1>
        <p className="text-xs text-slate-400 mb-6">Version {AVV_VERSION} · Stand {AVV_DATE}</p>

        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-10 text-sm text-blue-900 leading-relaxed">
          Diese Vorlage gilt zwischen jedem Kundenunternehmen (Verantwortlicher) und der
          Alpha Consult GmbH als Anbieterin von GateSign (Auftragsverarbeiter). Der AVV wird
          während der Einrichtung des Accounts elektronisch unterzeichnet. Eine unterzeichnete
          Fassung steht jederzeit im Admin-Bereich zum Download bereit.
        </div>

        <AvvDocument />

        <div className="mt-12 pt-6 border-t border-slate-100">
          <Link href="/" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">← Zurück zur Startseite</Link>
        </div>
      </main>
    </div>
  )
}
