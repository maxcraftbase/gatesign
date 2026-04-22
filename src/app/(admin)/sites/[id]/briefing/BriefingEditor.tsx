'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { clsx } from 'clsx'
import type { SafetyBriefing } from '@/types'
import { SUPPORTED_LANGUAGES } from '@/types'

interface Props {
  siteId: string
  existingBriefing: (SafetyBriefing & { briefing_translations: { language: string; content: string }[] }) | null
  languages: typeof SUPPORTED_LANGUAGES
}

export function BriefingEditor({ siteId, existingBriefing, languages }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('de')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const initialTexts = Object.fromEntries(
    languages.map(l => [
      l.code,
      existingBriefing?.briefing_translations?.find(t => t.language === l.code)?.content ?? ''
    ])
  )
  const [texts, setTexts] = useState<Record<string, string>>(initialTexts)

  async function handleSave() {
    const filled = Object.entries(texts).filter(([, v]) => v.trim())
    if (filled.length === 0) return

    setLoading(true)
    setError('')

    const res = await fetch('/api/briefing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        siteId,
        texts,
        existingBriefingId: existingBriefing?.id ?? null,
        existingVersion: existingBriefing?.version ?? 0,
      }),
    })

    if (!res.ok) {
      setError('Speichern fehlgeschlagen.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => setSuccess(false), 3000)
    router.refresh()
  }

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-sm text-slate-500">
        Hinterlegen Sie die Sicherheitsbelehrung in den gewünschten Sprachen.
        Jede Speicherung erstellt eine neue Version — Fahrer müssen dann einmalig neu bestätigen.
      </p>

      <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-3">
        {languages.map(l => (
          <button
            key={l.code}
            onClick={() => setActiveTab(l.code)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === l.code
                ? 'bg-slate-900 text-white'
                : texts[l.code]?.trim()
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            )}
          >
            {l.label}
            {texts[l.code]?.trim() && activeTab !== l.code && (
              <span className="ml-1 text-green-600">✓</span>
            )}
          </button>
        ))}
      </div>

      <textarea
        value={texts[activeTab] ?? ''}
        onChange={e => setTexts(prev => ({ ...prev, [activeTab]: e.target.value }))}
        rows={12}
        placeholder={`Sicherheitsbelehrung auf ${languages.find(l => l.code === activeTab)?.label}...`}
        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm resize-none focus:border-slate-900 focus:ring-2 focus:ring-slate-100 outline-none"
      />

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">
          {Object.values(texts).filter(v => v.trim()).length} von {languages.length} Sprachen ausgefüllt
        </p>
        <div className="flex items-center gap-3">
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button onClick={handleSave} loading={loading} size="md">
            {success ? '✓ Gespeichert' : 'Neue Version speichern'}
          </Button>
        </div>
      </div>
    </Card>
  )
}
