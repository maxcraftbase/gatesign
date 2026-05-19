'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Scale, Globe, ShieldAlert,
  Settings, Tablet, CheckCircle2,
  Check, MessageSquare,
  Factory, Truck, Cog, Building2, Package, Microscope,
  ShieldCheck, Server, ChevronDown,
} from 'lucide-react'
import { IsoSign } from '@/components/IsoSign'

const mockEntries = [
  { ref: 'LFS-2291', time: '05.05.26, 08:14', type: 'truck',   name: 'Tomasz Kowalski',  company: 'DHL Express',   plate: 'WA 4821 PL', flag: '🇵🇱', hasNote: true  },
  { ref: 'SCH-8814', time: '05.05.26, 07:53', type: 'truck',   name: 'Stefan Müller',    company: 'DB Schenker',   plate: 'MH-ST 882',  flag: '🇩🇪', hasNote: false },
  { ref: '—',        time: '05.05.26, 07:31', type: 'visitor', name: 'Gheorghe Ionescu', company: 'Trans Ro SRL',  plate: 'B 77 XYZ',   flag: '🇷🇴', hasNote: false },
  { ref: 'NET-0041', time: '04.05.26, 16:44', type: 'service', name: 'Andriy Kovalenko', company: 'Netto GmbH',    plate: 'HA-AK 201',  flag: '🇺🇦', hasNote: true  },
  { ref: 'GLS-7732', time: '04.05.26, 14:22', type: 'truck',   name: 'Mehmet Yilmaz',   company: 'GLS Germany',   plate: 'E-MY 5500',  flag: '🇹🇷', hasNote: false },
  { ref: 'LDL-0093', time: '04.05.26, 11:09', type: 'visitor', name: 'Jan Novák',        company: 'Lidl Logistik', plate: 'PR 3341 C',  flag: '🇨🇿', hasNote: false },
]

const typeBadge = {
  de: { truck: 'LKW', visitor: 'Besucher', service: 'Dienst.' },
  en: { truck: 'Truck', visitor: 'Visitor', service: 'Contractor' },
}
const typeBadgeClass = {
  truck:   'bg-amber-100 text-amber-800',
  visitor: 'bg-blue-100 text-blue-800',
  service: 'bg-violet-100 text-violet-800',
}

const industryIcons = [
  <Factory   key="factory"   className="w-3.5 h-3.5 flex-shrink-0" />,
  <Truck     key="truck"     className="w-3.5 h-3.5 flex-shrink-0" />,
  <Cog       key="cog"       className="w-3.5 h-3.5 flex-shrink-0" />,
  <Building2 key="building"  className="w-3.5 h-3.5 flex-shrink-0" />,
  <Package   key="package"   className="w-3.5 h-3.5 flex-shrink-0" />,
  <Microscope key="micro"    className="w-3.5 h-3.5 flex-shrink-0" />,
]

const content = {
  de: {
    nav: { login: 'Anmelden', register: 'Jetzt starten', demo: 'Demo anfragen' },
    hero: {
      title: 'Sicherheitsbelehrung digital — rechtssicher in 10 Minuten.',
      sub: 'Kein Papierchaos, keine Sprachbarriere. GateSign dokumentiert den Check-in rechtssicher — in der Sprache jedes Fahrers.',
      cta: '30 Tage kostenlos testen',
      demo: 'Demo anfragen',
    },
    trustedBy: {
      text: 'Bereits im Einsatz in Produktion, Logistik und Maschinenbau — in Deutschland, Österreich und der Schweiz.',
      industries: ['Produktion', 'Logistik', 'Maschinenbau', 'Baugewerbe', 'Großhandel'],
      dsgvo: ['DSGVO-konform', 'Server in der EU', 'AVV auf Anfrage'],
    },
    stats: [
      { value: '10', label: 'Sprachen — kein Fahrer ohne Verständnis' },
      { value: '28', label: 'ISO-Regeln — sofort einsetzbar' },
      { value: '3',  label: 'Besuchertypen — getrennt belehrt' },
      { value: '100%', label: 'Revisionssicher & BG-tauglich' },
    ],
    legal: {
      badge: 'Gesetzliche Pflicht',
      title: 'Papier reicht nicht mehr — und Unwissenheit schützt nicht.',
      sub: 'Das Arbeitsschutzgesetz verpflichtet jeden Betrieb, Besucher und externe Fahrer zu unterweisen — dokumentiert, verständlich und in einer Sprache, die sie verstehen. Wer das nicht nachweisen kann, haftet.',
      items: [
        {
          title: '§ 12 ArbSchG & DGUV Vorschrift 1',
          text: 'Sicherheitsunterweisung ist für alle Personen auf dem Betriebsgelände Pflicht — auch für LKW-Fahrer, Monteure und externe Dienstleister. Gilt auch für ausländische Fahrer und Subunternehmer (§ 823 BGB). Keine Ausnahme.',
        },
        {
          title: 'Sprachpflicht: Verständlich ist Pflicht',
          text: 'Eine Unterweisung auf Deutsch, die der polnische oder rumänische Fahrer nicht versteht, gilt rechtlich als nicht erfolgt — auch wenn er unterschrieben hat. Die Sprache des Empfängers entscheidet.',
        },
        {
          title: 'Haftung ohne Nachweis',
          text: 'BG-Regress bis 10 Mio. € (§ 110 SGB VII), Strafrecht § 229 StGB für verantwortliche Personen, mögliche Ablehnung der Betriebshaftpflicht wegen Obliegenheitsverletzung.',
        },
      ],
    },
    how: {
      title: 'So funktioniert GateSign',
      step: 'Schritt',
      steps: [
        { title: 'Einrichten', text: 'Sicherheitsregeln, Betriebszeiten und Belehrungstexte in wenigen Minuten konfigurieren.' },
        { title: 'Terminal aufstellen', text: 'Tablet oder Touchscreen am Eingang platzieren — als PWA, kein App-Store nötig.' },
        { title: 'Einchecken lassen', text: 'Besucher wählen Sprache, bestätigen Sicherheitsregeln, unterschreiben digital.' },
      ],
      terminalSteps: ['Sprache wählen', 'Besuchertyp wählen', 'Daten eingeben', 'Belehrung bestätigen', 'Unterschreiben'],
      terminalLabel: 'Ablauf am Terminal',
    },
    briefing: {
      badge: 'Sicherheitsbelehrung',
      title: 'Individuelle Belehrung — in jeder Sprache',
      sub: 'Jeder Besucher sieht die Sicherheitsregeln in seiner eigenen Sprache. Sie legen fest, welche Regeln gelten — GateSign übersetzt automatisch.',
      points: [
        { title: 'ISO-konforme Regeln', text: 'Wählen Sie aus einer Bibliothek mit 28 vordefinierten Regeln — Warnweste, Staplerverkehr, Zutrittsverbote und mehr.' },
        { title: 'PDF-Belehrung je Besuchertyp', text: 'Separate Dokumente für LKW-Fahrer, Besucher und Dienstleister — jeder bekommt genau das, was für ihn gilt.' },
        { title: 'Digitale Unterschrift', text: 'Rechtssichere Bestätigung direkt am Terminal. Alle Unterschriften werden mit Zeitstempel gespeichert.' },
        { title: '10 Sprachen', text: 'Deutsch, Englisch, Polnisch, Rumänisch, Ukrainisch, Türkisch, Tschechisch, Ungarisch, Bulgarisch, Russisch.' },
      ],
      rulesActive: 'Sicherheitsregeln — Aktiv',
      rulesStatus: '6 Regeln aktiv · automatisch übersetzt',
    },
    inBuilding: {
      badge: 'Anwesenheit',
      title: 'Wer ist gerade im Haus?',
      sub: 'Im Ernstfall zählt jede Sekunde. GateSign zeigt in Echtzeit, wer sich auf dem Gelände befindet — mit Besuchertyp, Herkunft und Ankunftszeit.',
      points: [
        'Echtzeit-Liste — aktualisiert alle 30 Sekunden',
        'Filter nach Besuchertyp und Zeitraum',
        'Exportierbar als PDF oder CSV für Notfalllisten',
        'Kontaktperson je Eintrag hinterlegbar',
      ],
      mockupLabel: 'Auf dem Gelände — jetzt',
      persons: '4 Personen',
      updatedAgo: 'Aktualisiert vor 12 Sekunden',
      sinceLabel: 'seit',
    },
    mockup: {
      title: 'Alle Check-ins auf einen Blick',
      sub: 'Das Admin-Dashboard zeigt jeden Eintrag in Echtzeit — mit Besuchertyp, Belehrungsstatus und Notizen.',
      badge: 'Live-Vorschau',
      cols: ['Referenz', 'Zeit', 'Typ', 'Fahrer', 'Firma', 'Kennzeichen', 'Spr.', 'Belehrung', ''],
      accepted: 'Ja',
      entries: 'Einträge gesamt',
      entriesTitle: 'Check-in Einträge',
      refresh: 'Aktualisieren',
      settings: 'Einstellungen',
      terminal: '← Check-In Terminal',
      logout: 'Abmelden',
    },
    dashboardFeatures: [
      'Echtzeit-Aktualisierung alle 30 Sekunden',
      'Suche nach Name, Firma, Kennzeichen',
      'Filter nach Besuchertyp & Sortierung nach jeder Spalte',
      'CSV-Export bis 10.000 Einträge (Excel-kompatibel)',
      'Eintragsdetails: Notiz, Unterschrift, PDF-Download & Druck',
      'Kontaktperson zuweisen pro Eintrag',
    ],
    featureBlocks: [
      {
        title: 'Terminal & Check-in',
        items: [
          '10 Sprachen — Fahrer wählt selbst',
          '3 Besuchertypen: LKW, Besucher, Dienstleister',
          'Digitale Unterschrift mit Zeitstempel',
          'Kiosk-Modus: Läuft auf jedem Tablet — kein IT-Aufwand',
        ],
      },
      {
        title: 'Belehrung & Dokumente',
        items: [
          '28 ISO-konforme Sicherheitsregeln',
          'PDF-Belehrung je Besuchertyp',
          'Firmen-PDF automatisch angehängt',
          'Eigene Hinweise mit KI-Übersetzung — im Dashboard kontrollierbar',
        ],
      },
      {
        title: 'Verwaltung & Team',
        items: [
          'Wer ist im Haus? — Echtzeit-Anwesenheitsliste',
          'Dashboard mit Suche, Filter & Sortierung',
          'Team-Management: Nutzer einladen & Rollen vergeben',
          'Audit-Log: alle Aktionen lückenlos protokolliert',
        ],
      },
      {
        title: 'Automatisierung',
        items: [
          'Täglicher Compliance-Agent: prüft fehlende Unterweisungen',
          'Wöchentliche Analyse: Top-Firmen, Spitzenzeiten',
          'Tägliche Digest-E-Mail mit CSV-Anhang',
          'Betriebszeiten-Anzeige in Fahrersprache',
        ],
      },
    ],
    featureBlocksTitle: 'Alles drin — vom Terminal bis zur Automatisierung',
    industries: {
      title: 'Passend für',
      items: [
        { text: 'Produktion & Fertigung', highlight: true },
        { text: 'Logistik & Spedition', highlight: true },
        { text: 'Maschinenbau', highlight: false },
        { text: 'Baugewerbe', highlight: false },
        { text: 'Großhandel & Lager', highlight: false },
        { text: 'Chemie & Pharma', highlight: false },
      ],
    },
    pricing: {
      title: 'Einfache Preisgestaltung',
      desc: 'Keine Einrichtungsgebühr · 30 Tage kostenlos · Jederzeit kündbar',
      trial: '30 Tage kostenlos',
      support: 'Inkl. E-Mail-Support & Einrichtungshilfe',
      cta: 'Jetzt starten',
      contact: 'Kontakt aufnehmen',
      onRequest: 'Auf Anfrage',
      included: 'Enthalten:',
      tiers: [
        {
          label: 'Starter',
          sublabel: '1 Terminal',
          price: '49',
          period: 'pro Monat',
          desc: 'Für einen Standort mit einem Eingang.',
          features: [
            '1 Terminal',
            'Check-in in 10 Sprachen',
            'Dashboard & CSV-Export',
            'PDF-Belehrung je Besuchertyp',
            '28 ISO-Sicherheitsregeln',
            'E-Mail-Support',
          ],
          highlight: false,
        },
        {
          label: 'Professional',
          sublabel: 'Bis 3 Terminals',
          price: '99',
          period: 'pro Monat',
          desc: 'Mehrere Eingänge oder Standorte — ein Paketpreis.',
          features: [
            'Bis 3 Terminals',
            'Alles aus Starter',
            'Täglicher Compliance-Agent',
            'Tägliche Digest-E-Mail + CSV',
            'Team-Management & Rollen',
            'Audit-Log',
            'Prioritäts-Support',
          ],
          highlight: true,
        },
        {
          label: 'Enterprise',
          sublabel: 'Unbegrenzt',
          price: null,
          period: 'Individuelles Angebot',
          desc: 'Für Konzerne und Betriebe mit vielen Standorten.',
          features: [
            'Unbegrenzte Terminals',
            'Alles aus Professional',
            'Individuelle Einrichtung',
            'SLA & dedizierter Support',
            'API-Zugang',
            'Beratung & Schulung',
          ],
          highlight: false,
        },
      ],
    },
    faq: {
      title: 'Häufige Fragen',
      items: [
        {
          q: 'Ist die digitale Unterschrift rechtsgültig?',
          a: 'Ja. Jede Unterschrift wird mit Zeitstempel, Gerätekennung und IP-Adresse gespeichert und revisionssicher archiviert — gemäß den Anforderungen der DGUV Vorschrift 1 und § 12 ArbSchG.',
        },
        {
          q: 'Wo werden die Daten gespeichert?',
          a: 'Alle Daten liegen auf Servern in der EU. GateSign ist DSGVO-konform. Einen Auftragsverarbeitungsvertrag (AVV) stellen wir auf Anfrage bereit.',
        },
        {
          q: 'Brauche ich spezielle Hardware?',
          a: 'Nein. GateSign läuft als PWA auf jedem modernen Tablet oder Touchscreen-Bildschirm — kein App-Store, keine IT-Abteilung nötig. Ein handelsübliches Android- oder iPad-Tablet genügt.',
        },
        {
          q: 'Was passiert nach den 30 Tagen?',
          a: 'Sie entscheiden. Kündigen Sie jederzeit — Ihre Daten bleiben 30 Tage nach Kündigung exportierbar. Keine automatische Verlängerung ohne Ihre Zustimmung.',
        },
        {
          q: 'Kann ich eigene Sicherheitsregeln hinzufügen?',
          a: 'Ja. Sie können eigene Texte, Regeln und Betriebsanweisungen ergänzen. GateSign übersetzt diese automatisch in alle 10 Sprachen — Sie behalten die Kontrolle.',
        },
        {
          q: 'Funktioniert GateSign ohne Internet?',
          a: 'Für den Check-in ist eine kurze Internetverbindung erforderlich, da Einträge direkt gespeichert werden. Das Terminal zeigt einen Hinweis, wenn keine Verbindung besteht.',
        },
      ],
    },
    finalCta: {
      title: 'Bereit für rechtssichere Check-ins?',
      sub: 'Starten Sie jetzt — keine Kreditkarte, keine Einrichtungsgebühr, jederzeit kündbar.',
      cta: '30 Tage kostenlos testen →',
      demo: 'Demo anfragen',
    },
    footer: {
      rights: '© 2025 Alpha Consult GmbH · GateSign',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      contact: 'info@gatesign.de',
    },
  },
  en: {
    nav: { login: 'Log in', register: 'Get started', demo: 'Request demo' },
    hero: {
      title: 'Safety briefings done right — legally compliant in 10 minutes.',
      sub: 'No paperwork, no language barriers. GateSign documents every check-in — legally sound, in the driver\'s own language.',
      cta: 'Try free for 30 days',
      demo: 'Request a demo',
    },
    trustedBy: {
      text: 'Already in use across production, logistics and mechanical engineering — in Germany, Austria and Switzerland.',
      industries: ['Production', 'Logistics', 'Engineering', 'Construction', 'Wholesale'],
      dsgvo: ['GDPR-compliant', 'EU servers', 'DPA available'],
    },
    stats: [
      { value: '10', label: 'Languages — no driver left without understanding' },
      { value: '28', label: 'ISO rules — ready to use immediately' },
      { value: '3',  label: 'Visitor types — briefed separately' },
      { value: '100%', label: 'Audit-proof & BG-compliant' },
    ],
    legal: {
      badge: 'Legal Requirement',
      title: 'Paper is no longer enough — and ignorance is no defence.',
      sub: 'Occupational health law requires every business to brief visitors and external drivers — documented, comprehensible, and in a language they understand. Those who cannot prove it are liable.',
      items: [
        {
          title: '§ 12 ArbSchG & DGUV Regulation 1',
          text: 'Safety briefings are mandatory for all persons on company premises — including truck drivers, engineers and external contractors. Applies to foreign drivers and subcontractors too (§ 823 BGB). No exceptions.',
        },
        {
          title: 'Language requirement: comprehensible means native language',
          text: 'A briefing in German that a Polish or Romanian driver cannot understand is legally treated as no briefing at all — even if they signed. The recipient\'s language is what counts.',
        },
        {
          title: 'Liability without proof',
          text: 'BG recourse up to €10 million (§ 110 SGB VII), criminal liability § 229 StGB for responsible persons, possible rejection by employer\'s liability insurance.',
        },
      ],
    },
    how: {
      title: 'How GateSign works',
      step: 'Step',
      steps: [
        { title: 'Set up', text: 'Configure safety rules, opening hours and briefing texts in minutes.' },
        { title: 'Place terminal', text: 'Mount a tablet or touchscreen at your entrance — as a PWA, no app store needed.' },
        { title: 'Let visitors check in', text: 'Visitors choose their language, confirm safety rules and sign digitally.' },
      ],
      terminalSteps: ['Choose language', 'Choose visitor type', 'Enter details', 'Confirm briefing', 'Sign'],
      terminalLabel: 'Terminal flow',
    },
    briefing: {
      badge: 'Safety Briefing',
      title: 'Individual briefing — in every language',
      sub: 'Every visitor sees the safety rules in their own language. You decide which rules apply — GateSign translates automatically.',
      points: [
        { title: 'ISO-compliant rules', text: 'Choose from a library of 28 predefined rules — high-vis vest, forklift traffic, no-entry zones and more.' },
        { title: 'PDF briefing per visitor type', text: 'Separate documents for truck drivers, visitors and contractors — everyone gets exactly what applies to them.' },
        { title: 'Digital signature', text: 'Legally sound confirmation directly at the terminal. All signatures are stored with a timestamp.' },
        { title: '10 languages', text: 'German, English, Polish, Romanian, Ukrainian, Turkish, Czech, Hungarian, Bulgarian, Russian.' },
      ],
      rulesActive: 'Safety Rules — Active',
      rulesStatus: '6 rules active · automatically translated',
    },
    inBuilding: {
      badge: 'Presence',
      title: 'Who\'s on site right now?',
      sub: 'In an emergency, every second counts. GateSign shows in real time who is on site — with visitor type, origin and arrival time.',
      points: [
        'Real-time list — updated every 30 seconds',
        'Filter by visitor type and time period',
        'Exportable as PDF or CSV for emergency rosters',
        'Contact person assignable per entry',
      ],
      mockupLabel: 'On site — right now',
      persons: '4 persons',
      updatedAgo: 'Updated 12 seconds ago',
      sinceLabel: 'since',
    },
    mockup: {
      title: 'All check-ins at a glance',
      sub: 'The admin dashboard shows every entry in real time — with visitor type, briefing status and notes.',
      badge: 'Live preview',
      cols: ['Reference', 'Time', 'Type', 'Driver', 'Company', 'Plate', 'Lang.', 'Briefing', ''],
      accepted: 'Yes',
      entries: 'entries total',
      entriesTitle: 'Check-in Entries',
      refresh: 'Refresh',
      settings: 'Settings',
      terminal: '← Check-In Terminal',
      logout: 'Log out',
    },
    dashboardFeatures: [
      'Real-time updates every 30 seconds',
      'Search by name, company or licence plate',
      'Filter by visitor type & sort by any column',
      'CSV export up to 10,000 entries (Excel-compatible)',
      'Entry details: notes, signature, PDF download & print',
      'Assign a contact person per entry',
    ],
    featureBlocks: [
      {
        title: 'Terminal & Check-in',
        items: [
          '10 languages — visitor chooses',
          '3 visitor types: truck, visitor, contractor',
          'Digital signature with timestamp',
          'Kiosk mode: runs on any tablet — no IT effort',
        ],
      },
      {
        title: 'Briefings & Documents',
        items: [
          '28 ISO-compliant safety rules',
          'PDF briefing per visitor type',
          'Company PDF automatically attached',
          'Custom hints with AI translation — reviewable in dashboard',
        ],
      },
      {
        title: 'Management & Team',
        items: [
          'Who\'s on site? — real-time presence list',
          'Dashboard with search, filter & sorting',
          'Team management: invite users & assign roles',
          'Audit log: every action fully documented',
        ],
      },
      {
        title: 'Automation',
        items: [
          'Daily compliance agent: checks missing briefings',
          'Weekly analysis: top companies, peak hours',
          'Daily digest email with CSV attachment',
          'Opening hours displayed in driver\'s language',
        ],
      },
    ],
    featureBlocksTitle: 'Everything included — from terminal to automation',
    industries: {
      title: 'Built for',
      items: [
        { text: 'Production & Manufacturing', highlight: true },
        { text: 'Logistics & Haulage', highlight: true },
        { text: 'Mechanical Engineering', highlight: false },
        { text: 'Construction', highlight: false },
        { text: 'Wholesale & Warehousing', highlight: false },
        { text: 'Chemical & Pharma', highlight: false },
      ],
    },
    pricing: {
      title: 'Simple pricing',
      desc: 'No setup fee · 30 days free · Cancel anytime',
      trial: '30 days free',
      support: 'Incl. email support & onboarding help',
      cta: 'Get started',
      contact: 'Contact us',
      onRequest: 'On request',
      included: 'Included:',
      tiers: [
        {
          label: 'Starter',
          sublabel: '1 Terminal',
          price: '49',
          period: 'per month',
          desc: 'Ideal for one location with a single entrance.',
          features: [
            '1 terminal',
            'Check-in in 10 languages',
            'Dashboard & CSV export',
            'PDF briefing per visitor type',
            '28 ISO safety rules',
            'Email support',
          ],
          highlight: false,
        },
        {
          label: 'Professional',
          sublabel: 'Up to 3 Terminals',
          price: '99',
          period: 'per month',
          desc: 'Multiple entrances or locations — one flat rate.',
          features: [
            'Up to 3 terminals',
            'Everything in Starter',
            'Daily compliance agent',
            'Daily digest email + CSV',
            'Team management & roles',
            'Audit log',
            'Priority support',
          ],
          highlight: true,
        },
        {
          label: 'Enterprise',
          sublabel: 'Unlimited',
          price: null,
          period: 'Custom quote',
          desc: 'For enterprises and businesses with many locations.',
          features: [
            'Unlimited terminals',
            'Everything in Professional',
            'Custom onboarding',
            'SLA & dedicated support',
            'API access',
            'Training & consulting',
          ],
          highlight: false,
        },
      ],
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          q: 'Is the digital signature legally valid?',
          a: 'Yes. Every signature is stored with a timestamp, device identifier and IP address, archived in a tamper-proof, audit-compliant format — meeting the requirements of DGUV Regulation 1 and § 12 ArbSchG.',
        },
        {
          q: 'Where is the data stored?',
          a: 'All data is stored on servers in the EU. GateSign is GDPR-compliant. A Data Processing Agreement (DPA) is available on request.',
        },
        {
          q: 'Do I need special hardware?',
          a: 'No. GateSign runs as a PWA on any modern tablet or touchscreen — no app store, no IT department required. A standard Android or iPad tablet is all you need.',
        },
        {
          q: 'What happens after the 30-day trial?',
          a: 'You decide. Cancel any time — your data remains exportable for 30 days after cancellation. No automatic renewal without your consent.',
        },
        {
          q: 'Can I add my own safety rules?',
          a: 'Yes. You can add custom texts, rules and operating instructions. GateSign translates them automatically into all 10 languages — you stay in control.',
        },
        {
          q: 'Does GateSign work without internet?',
          a: 'A brief internet connection is needed for check-in, as entries are saved immediately. The terminal displays a notice if the connection is lost.',
        },
      ],
    },
    finalCta: {
      title: 'Ready for legally compliant check-ins?',
      sub: 'Get started now — no credit card, no setup fee, cancel anytime.',
      cta: 'Try free for 30 days →',
      demo: 'Request a demo',
    },
    footer: {
      rights: '© 2025 Alpha Consult GmbH · GateSign',
      impressum: 'Impressum',
      datenschutz: 'Privacy Policy',
      contact: 'info@gatesign.de',
    },
  },
}

const legalIcons = [
  <Scale      key="scale"  className="w-5 h-5 text-amber-700" strokeWidth={1.5} />,
  <Globe      key="globe"  className="w-5 h-5 text-amber-700" strokeWidth={1.5} />,
  <ShieldAlert key="shield" className="w-5 h-5 text-amber-700" strokeWidth={1.5} />,
]

const howIcons = [
  <Settings    key="settings" className="w-5 h-5 text-slate-500" strokeWidth={1.5} />,
  <Tablet      key="tablet"   className="w-5 h-5 text-slate-500" strokeWidth={1.5} />,
  <CheckCircle2 key="check"   className="w-5 h-5 text-slate-500" strokeWidth={1.5} />,
]

function TerminalMockup({ lang }: { lang: 'de' | 'en' }) {
  const languages = [
    { flag: '🇩🇪', name: 'Deutsch' },
    { flag: '🇬🇧', name: 'English' },
    { flag: '🇵🇱', name: 'Polski' },
    { flag: '🇷🇴', name: 'Română' },
    { flag: '🇺🇦', name: 'Українська' },
    { flag: '🇹🇷', name: 'Türkçe' },
    { flag: '🇨🇿', name: 'Čeština' },
    { flag: '🇭🇺', name: 'Magyar' },
  ]
  return (
    <div className="relative select-none">
      <div className="bg-slate-800 rounded-[2rem] p-3 shadow-2xl w-72">
        <div className="bg-white rounded-[1.5rem] overflow-hidden">
          {/* Header */}
          <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm tracking-tight">GateSign</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">
                {lang === 'de' ? 'Aktiv' : 'Active'}
              </span>
            </div>
          </div>
          {/* Progress + title */}
          <div className="bg-slate-50 px-5 pt-4 pb-3">
            <div className="flex gap-1 mb-3">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-slate-900' : 'bg-slate-200'}`}
                />
              ))}
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
              {lang === 'de' ? 'Schritt 1 von 5' : 'Step 1 of 5'}
            </p>
            <p className="text-sm font-bold text-slate-900 mt-0.5">
              {lang === 'de' ? 'Sprache wählen' : 'Choose language'}
            </p>
          </div>
          {/* Language grid */}
          <div className="px-3 pb-4 pt-2 grid grid-cols-2 gap-1.5">
            {languages.map((l, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
                  i === 0
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-sm leading-none">{l.flag}</span>
                <span className="truncate">{l.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Glow shadow */}
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-slate-900/20 blur-xl rounded-full" />
    </div>
  )
}

export default function LandingPage() {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const t = content[lang]
  const badges = typeBadge[lang]

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">GateSign</span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
              className="text-sm text-slate-400 hover:text-slate-700 transition-colors font-medium px-2"
            >
              {lang === 'de' ? 'EN' : 'DE'}
            </button>
            <a
              href="mailto:info@gatesign.de"
              className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              {t.nav.demo}
            </a>
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
              {t.nav.login}
            </Link>
            <Link
              href="/register"
              className="text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              {t.nav.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero — two column with terminal mockup */}
      <section className="flex flex-col" style={{ minHeight: 'calc(100vh - 64px)' }}>
        <div className="flex-1 flex items-center">
          <div className="max-w-5xl mx-auto px-6 py-16 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left: Text */}
              <div className="flex-1 text-center lg:text-left">
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
                  {t.hero.title}
                </h1>
                <p className="text-lg text-slate-500 mb-10 leading-relaxed lg:max-w-xl mx-auto lg:mx-0">
                  {t.hero.sub}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link
                    href="/register"
                    className="inline-block bg-slate-900 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    {t.hero.cta} →
                  </Link>
                  <a
                    href="mailto:info@gatesign.de"
                    className="inline-block text-slate-500 text-base font-medium px-8 py-4 rounded-xl hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    {t.hero.demo}
                  </a>
                </div>
              </div>
              {/* Right: Terminal mockup */}
              <div className="flex-shrink-0 hidden lg:block">
                <TerminalMockup lang={lang} />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="bg-slate-900">
          <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {t.stats.map((s, i) => (
              <div key={i}>
                <div className="text-4xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-sm text-slate-400 font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="border-b border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-400 mb-4">{t.trustedBy.text}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {t.trustedBy.industries.map((ind, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-sm font-medium bg-slate-50 border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full"
              >
                {industryIcons[i]}
                {ind}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            {[
              { icon: <ShieldCheck key="sc" className="w-3.5 h-3.5" />, text: t.trustedBy.dsgvo[0] },
              { icon: <Server      key="sv" className="w-3.5 h-3.5" />, text: t.trustedBy.dsgvo[1] },
              { icon: <Check       key="ch" className="w-3.5 h-3.5" />, text: t.trustedBy.dsgvo[2] },
            ].map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-full"
              >
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Section */}
      <section className="bg-amber-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.legal.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4">{t.legal.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.legal.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.legal.items.map((item, i) => (
              <div key={i} className="bg-white border border-amber-200 rounded-2xl p-6">
                <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center mb-4">
                  {legalIcons[i]}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Briefing Section */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row gap-12 items-center">
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.briefing.badge}
            </span>
            <h2 className="text-3xl font-bold leading-tight mb-4">{t.briefing.title}</h2>
            <p className="text-slate-500 leading-relaxed mb-8">{t.briefing.sub}</p>
            <div className="space-y-5">
              {t.briefing.points.map((p, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-0.5">{p.title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed">{p.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 w-full max-w-sm mx-auto lg:max-w-none">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
              <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide mb-4">
                {t.briefing.rulesActive}
              </p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { code: 'M015', signType: 'mandatory' as const, de: 'Warnweste tragen',    en: 'High-vis vest required' },
                  { code: 'W014', signType: 'warning'   as const, de: 'Staplerverkehr',       en: 'Forklift traffic' },
                  { code: 'P004', signType: 'prohibition' as const, de: 'Zutritt verboten',   en: 'No unauthorised entry' },
                  { code: 'W001', signType: 'warning'   as const, de: 'Am Fahrzeug bleiben',  en: 'Stay at vehicle' },
                  { signType: 'limit' as const,           de: 'Schrittgeschwindigkeit',        en: 'Walking pace only' },
                  { signType: 'prohibition' as const, icon: '🎧', de: 'Kopfhörer verboten',   en: 'No headphones' },
                ].map((rule, i) => (
                  <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-3 flex items-center gap-2">
                    <IsoSign code={(rule as { code?: string }).code} icon={(rule as { icon?: string }).icon} signType={rule.signType} size={36} />
                    <span className="text-xs text-amber-900 font-medium leading-tight">
                      {lang === 'de' ? rule.de : rule.en}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-xs text-slate-400">{t.briefing.rulesStatus}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">{t.how.title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            {t.how.steps.map((step, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-8 h-8 rounded-lg bg-slate-900 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {howIcons[i]}
                  </div>
                </div>
                <h3 className="text-base font-bold mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>

          {/* Terminal step flow */}
          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-6 shadow-sm">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide text-center mb-5">
              {t.how.terminalLabel}
            </p>
            <div className="flex items-center justify-between gap-2">
              {t.how.terminalSteps.map((step, i) => (
                <div key={i} className="flex items-center flex-1 last:flex-none">
                  <div className="flex flex-col items-center flex-1">
                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center mb-2 flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-xs font-medium text-slate-600 text-center leading-tight">{step}</span>
                  </div>
                  {i < t.how.terminalSteps.length - 1 && (
                    <div className="w-6 h-px bg-slate-200 flex-shrink-0 mb-4" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard Mockup */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold bg-slate-900 text-white px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.mockup.badge}
            </span>
            <h2 className="text-2xl font-bold mb-3">{t.mockup.title}</h2>
            <p className="text-slate-500 text-sm max-w-lg mx-auto">{t.mockup.sub}</p>
          </div>

          <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-200 mb-10">
            {/* Browser chrome */}
            <div className="bg-slate-100 px-4 py-3 flex items-center gap-3 border-b border-slate-200">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-white rounded-md px-3 py-1 text-xs text-slate-400 font-mono">
                gatesign.de/ihre-firma/admin
              </div>
            </div>
            {/* App nav */}
            <div className="bg-white border-b border-slate-100 px-6 h-12 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="font-bold text-slate-900 text-sm">GateSign</span>
                <div className="flex gap-1">
                  <span className="bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    {t.mockup.entriesTitle}
                  </span>
                  <span className="text-slate-500 text-xs font-medium px-3 py-1.5 rounded-lg">
                    {t.mockup.settings}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">{t.mockup.terminal}</span>
                <span className="text-xs text-slate-400">{t.mockup.logout}</span>
              </div>
            </div>
            {/* Table */}
            <div className="bg-white">
              <div className="px-6 py-4 flex items-center justify-between border-b border-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{t.mockup.entriesTitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{mockEntries.length} {t.mockup.entries}</p>
                </div>
                <div className="flex gap-2">
                  <button className="text-xs border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg pointer-events-none">
                    ↻ {t.mockup.refresh}
                  </button>
                  <button className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded-lg pointer-events-none">
                    ↓ CSV
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-100">
                      {t.mockup.cols.map((col, ci) => (
                        <th key={ci} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockEntries.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-b-0 hover:bg-slate-50/50">
                        <td className="px-4 py-3 text-slate-400 font-mono whitespace-nowrap">{row.ref}</td>
                        <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{row.time}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-md whitespace-nowrap ${typeBadgeClass[row.type as keyof typeof typeBadgeClass]}`}>
                            {badges[row.type as keyof typeof badges]}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900 whitespace-nowrap">{row.name}</td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{row.company}</td>
                        <td className="px-4 py-3">
                          <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs">{row.plate}</span>
                        </td>
                        <td className="px-4 py-3 text-base">{row.flag}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                            ✓ {t.mockup.accepted}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {row.hasNote && (
                            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Dashboard feature list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-w-4xl mx-auto">
            {t.dashboardFeatures.map((f, i) => (
              <div key={i} className="flex items-start gap-3 bg-white rounded-xl px-4 py-3 border border-slate-200">
                <Check className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                <span className="text-sm text-slate-600 leading-snug">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Im Haus — Anwesenheit */}
      <section className="max-w-5xl mx-auto px-6 py-20">
        <div className="flex flex-col lg:flex-row-reverse gap-12 items-center">
          {/* Mockup */}
          <div className="flex-1 w-full max-w-sm mx-auto lg:max-w-none">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  {t.inBuilding.mockupLabel}
                </p>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs text-slate-400">{t.inBuilding.persons}</span>
                </div>
              </div>
              <div className="space-y-2">
                {mockEntries.slice(0, 4).map((person, i) => (
                  <div key={i} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3 py-2.5">
                    <span className="text-base leading-none">{person.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{person.name}</p>
                      <p className="text-xs text-slate-400 truncate">{person.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${typeBadgeClass[person.type as keyof typeof typeBadgeClass]}`}>
                        {badges[person.type as keyof typeof badges]}
                      </span>
                      <span className="text-xs text-slate-400">
                        {t.inBuilding.sinceLabel} {person.time.split(', ')[1]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 text-center">
                <p className="text-xs text-slate-400">{t.inBuilding.updatedAgo}</p>
              </div>
            </div>
          </div>
          {/* Text */}
          <div className="flex-1">
            <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.inBuilding.badge}
            </span>
            <h2 className="text-3xl font-bold leading-tight mb-4">{t.inBuilding.title}</h2>
            <p className="text-slate-500 leading-relaxed mb-6">{t.inBuilding.sub}</p>
            <div className="space-y-3">
              {t.inBuilding.points.map((point, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-slate-700">{point}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Feature Blocks */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-12">{t.featureBlocksTitle}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {t.featureBlocks.map((block, bi) => (
              <div key={bi} className="bg-white border border-slate-200 rounded-2xl p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">{block.title}</p>
                <div className="space-y-2">
                  {block.items.map((item, ii) => (
                    <div key={ii} className="flex items-center gap-3 bg-slate-50 rounded-xl px-4 py-3 border border-slate-100">
                      <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" strokeWidth={2.5} />
                      <span className="text-sm text-slate-700 font-medium">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-8">{t.industries.title}</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {t.industries.items.map((item, i) => (
              <div
                key={i}
                className="rounded-full px-5 py-2.5 border flex items-center gap-2 bg-white border-slate-200 text-slate-700"
              >
                {industryIcons[i]}
                <span className="text-sm font-semibold">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">{t.pricing.title}</h2>
          <p className="text-sm text-slate-400 mb-10">{t.pricing.desc}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {t.pricing.tiers.map((tier, i) => (
              <div
                key={i}
                className={`rounded-2xl p-7 border flex flex-col text-left ${
                  tier.highlight
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className={`text-xs font-semibold mb-4 px-3 py-1 rounded-full self-start ${
                  tier.highlight
                    ? 'bg-white/10 text-white'
                    : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {t.pricing.trial}
                </div>
                <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
                  tier.highlight ? 'text-slate-400' : 'text-slate-400'
                }`}>
                  {tier.label}
                </p>
                <p className={`text-sm font-bold mb-4 ${tier.highlight ? 'text-slate-200' : 'text-slate-600'}`}>
                  {tier.sublabel}
                </p>
                {tier.price ? (
                  <div className="mb-1">
                    <span className={`text-4xl font-bold ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                      €{tier.price}
                    </span>
                    <span className={`text-sm ml-1 ${tier.highlight ? 'text-slate-400' : 'text-slate-400'}`}>
                      {tier.period}
                    </span>
                  </div>
                ) : (
                  <div className={`text-2xl font-bold mb-1 ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {t.pricing.onRequest}
                  </div>
                )}
                <p className={`text-sm leading-relaxed mb-5 ${tier.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
                  {tier.desc}
                </p>
                <div className="mb-6 flex-1">
                  <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${tier.highlight ? 'text-slate-400' : 'text-slate-400'}`}>
                    {t.pricing.included}
                  </p>
                  <div className="space-y-2">
                    {tier.features.map((feature, fi) => (
                      <div key={fi} className="flex items-center gap-2">
                        <Check
                          className={`w-3.5 h-3.5 flex-shrink-0 ${tier.highlight ? 'text-emerald-400' : 'text-emerald-600'}`}
                          strokeWidth={2.5}
                        />
                        <span className={`text-sm ${tier.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className={`text-xs mb-4 ${tier.highlight ? 'text-slate-500' : 'text-slate-400'}`}>
                  {t.pricing.support}
                </p>
                {tier.price ? (
                  <Link
                    href="/register"
                    className={`block w-full font-semibold py-3 rounded-xl transition-colors text-sm text-center ${
                      tier.highlight
                        ? 'bg-white text-slate-900 hover:bg-slate-100'
                        : 'bg-slate-900 text-white hover:bg-slate-700'
                    }`}
                  >
                    {t.pricing.cta}
                  </Link>
                ) : (
                  <a
                    href="mailto:info@gatesign.de"
                    className="block w-full font-semibold py-3 rounded-xl transition-colors text-sm text-center bg-slate-900 text-white hover:bg-slate-700"
                  >
                    {t.pricing.contact}
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-center mb-10">{t.faq.title}</h2>
          <div className="space-y-2">
            {t.faq.items.map((item, i) => (
              <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-white">
                <button
                  onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4 leading-snug">{item.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${
                      faqOpen === i ? 'rotate-180' : ''
                    }`}
                    strokeWidth={2}
                  />
                </button>
                {faqOpen === i && (
                  <div className="px-6 pb-5 border-t border-slate-100">
                    <p className="text-slate-500 leading-relaxed text-sm pt-4">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">{t.finalCta.title}</h2>
          <p className="text-slate-400 mb-10 leading-relaxed">{t.finalCta.sub}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-block bg-white text-slate-900 text-base font-semibold px-8 py-4 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {t.finalCta.cta}
            </Link>
            <a
              href="mailto:info@gatesign.de"
              className="inline-block text-slate-400 text-base font-medium px-8 py-4 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
            >
              {t.finalCta.demo}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>{t.footer.rights}</span>
            <a href={`mailto:${t.footer.contact}`} className="hover:text-slate-600 transition-colors">
              {t.footer.contact}
            </a>
          </div>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-slate-600 transition-colors">{t.footer.impressum}</Link>
            <Link href="/datenschutz" className="hover:text-slate-600 transition-colors">{t.footer.datenschutz}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
