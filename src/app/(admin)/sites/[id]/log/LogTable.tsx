'use client'
import { useState } from 'react'
import type { CheckIn } from '@/types'
import { Button } from '@/components/ui/Button'
import { Download } from 'lucide-react'

export function LogTable({ checkIns, siteName }: { checkIns: CheckIn[]; siteName: string }) {
  const [search, setSearch] = useState('')

  const filtered = checkIns.filter(c =>
    !search ||
    c.driver_name.toLowerCase().includes(search.toLowerCase()) ||
    c.license_plate.toLowerCase().includes(search.toLowerCase()) ||
    c.driver_company.toLowerCase().includes(search.toLowerCase())
  )

  function exportCSV() {
    const rows = [
      ['Datum', 'Uhrzeit', 'Kennzeichen', 'Fahrer', 'Firma', 'Telefon', 'Sprache', 'Belehrung', 'Version'],
      ...filtered.map(c => [
        new Date(c.timestamp).toLocaleDateString('de-DE'),
        new Date(c.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        c.license_plate,
        c.driver_name,
        c.driver_company,
        c.driver_phone,
        c.language,
        c.briefing_confirmed ? 'Ja' : 'Nein',
        `v${c.briefing_version}`,
      ])
    ]

    const csv = rows.map(r => r.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `gatesign-${siteName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Suche nach Kennzeichen, Fahrer, Firma..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none"
        />
        <Button onClick={exportCSV} variant="secondary" size="md">
          <Download size={15} className="mr-2" />
          CSV Export
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 font-medium text-slate-600">Datum</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Zeit</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Kennzeichen</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Fahrer</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Firma</th>
                <th className="text-left px-4 py-3 font-medium text-slate-600">Belehrung</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    {checkIns.length === 0 ? 'Noch keine Check-ins.' : 'Keine Ergebnisse.'}
                  </td>
                </tr>
              ) : (
                filtered.map(c => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-700">
                      {new Date(c.timestamp).toLocaleDateString('de-DE')}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(c.timestamp).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-900 text-xs">{c.license_plate}</td>
                    <td className="px-4 py-3 text-slate-700">{c.driver_name}</td>
                    <td className="px-4 py-3 text-slate-500">{c.driver_company}</td>
                    <td className="px-4 py-3">
                      {c.briefing_confirmed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
                          ✓ v{c.briefing_version}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-right">{filtered.length} Einträge</p>
    </div>
  )
}
