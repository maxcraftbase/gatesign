'use client'

import { useState } from 'react'
import Link from 'next/link'

type Tab = 'ipad' | 'windows' | 'android'

const steps = {
  ipad: {
    label: 'iPad',
    tip: 'Der Geführte Zugriff sperrt das iPad vollständig auf Safari — der Fahrer kann keine anderen Apps öffnen oder die Seite verlassen.',
    items: [
      <>Öffnen Sie die <strong>Einstellungen</strong> auf dem iPad</>,
      <>Tippen Sie auf <strong>Bedienungshilfen</strong> → <strong>Geführter Zugriff</strong></>,
      <>Aktivieren Sie <strong>Geführter Zugriff</strong> und setzen Sie einen PIN-Code unter <strong>Code-Einstellungen</strong></>,
      <>Öffnen Sie <strong>Safari</strong> und rufen Sie Ihre GateSign-Adresse auf (z.B. <code className="bg-slate-100 px-1 py-0.5 rounded text-sm font-mono">https://gatesign-production.up.railway.app/ihr-slug</code>)</>,
      <>Tippen Sie <strong>dreimal</strong> auf die <strong>Seitentaste</strong> (oder Home-Taste bei älteren iPads)</>,
      <>Tippen Sie auf <strong>Starten</strong> — das iPad ist jetzt im gesperrten Kiosk-Modus</>,
      <>Zum Beenden: dreimal Seitentaste tippen, PIN eingeben, <strong>Beenden</strong> tippen</>,
    ],
  },
  windows: {
    label: 'Windows PC',
    tip: 'Im Chrome-Kiosk-Modus sind alle Browser-Steuerelemente ausgeblendet — keine Adressleiste, kein Schließen-Button. Alt + F4 beendet den Modus.',
    items: [
      <>Klicken Sie mit der rechten Maustaste auf den Desktop → <strong>Neu</strong> → <strong>Verknüpfung</strong></>,
      <>Geben Sie folgenden Pfad ein (Ihre GateSign-Adresse anpassen):<br /><code className="block bg-slate-100 px-3 py-2 rounded text-xs font-mono mt-2 break-all">{'"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk https://gatesign-production.up.railway.app/ihr-slug'}</code></>,
      <>Benennen Sie die Verknüpfung z.B. {'\u201eGateSign Kiosk\u201c'}</>,
      <>Doppelklicken Sie auf die Verknüpfung — Chrome öffnet sich im Vollbild-Kiosk-Modus</>,
      <>Zum Beenden: <strong>Alt + F4</strong> drücken</>,
    ],
  },
  android: {
    label: 'Android',
    tip: 'Die Bildschirmfixierung ist bei allen modernen Android-Geräten verfügbar, heißt aber je nach Hersteller unterschiedlich — suchen Sie in den Einstellungen nach „Fixierung" oder „Pinning".',
    items: [
      <>Öffnen Sie die <strong>Einstellungen</strong> → <strong>Sicherheit</strong> (oder <strong>Biometrie und Sicherheit</strong>)</>,
      <>Tippen Sie auf <strong>Bildschirmfixierung</strong> (oder {'\u201eApp-Fixierung\u201c'}) und aktivieren Sie diese</>,
      <>Aktivieren Sie auch <strong>PIN vor Aufheben der Fixierung verlangen</strong></>,
      <>Öffnen Sie <strong>Chrome</strong> und rufen Sie Ihre GateSign-Adresse auf</>,
      <>Tippen Sie auf die <strong>Übersicht-Taste</strong> (Quadrat) am unteren Rand</>,
      <>Tippen Sie auf das <strong>Chrome-Symbol</strong> oben auf der App-Karte → <strong>Fixieren</strong></>,
      <>Zum Beenden: <strong>Zurück</strong> und <strong>Übersicht</strong> gleichzeitig gedrückt halten, dann PIN eingeben</>,
    ],
  },
}

export default function EinrichtungPage() {
  const [activeTab, setActiveTab] = useState<Tab>('ipad')

  const current = steps[activeTab]

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-2xl font-bold text-slate-900 hover:text-slate-700 transition-colors">
            GateSign
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mt-4 mb-2">Einrichtungsanleitung</h1>
          <p className="text-slate-500 text-base">
            Richten Sie GateSign als Kiosk-Terminal auf Ihrem Gerät ein — in wenigen Minuten einsatzbereit.
          </p>
        </div>

        {/* Tab selector */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl border border-slate-200 p-1.5 shadow-sm">
          {(Object.keys(steps) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              {steps[tab].label}
            </button>
          ))}
        </div>

        {/* Tip box */}
        <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3.5 mb-6">
          <span className="text-blue-500 mt-0.5 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </span>
          <p className="text-blue-800 text-sm leading-relaxed">{current.tip}</p>
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">{current.label} — Schritt für Schritt</h2>
          </div>
          <ol className="divide-y divide-slate-50">
            {current.items.map((step, i) => (
              <li key={i} className="flex gap-4 px-6 py-4">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <p className="text-sm text-slate-700 leading-relaxed pt-0.5">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Footer note */}
        <div className="text-center">
          <p className="text-slate-400 text-sm">
            Bei Fragen wenden Sie sich an{' '}
            <a href="mailto:support@gatesign.app" className="text-slate-600 hover:underline font-medium">
              support@gatesign.app
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}
