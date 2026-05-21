'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Scale, Globe, ShieldAlert,
  Settings, Tablet, CheckCircle2,
  Check,
  Factory, Truck, Cog, Building2, Package, Microscope,
  ShieldCheck, Server, ChevronDown, X,
  Printer, Eye, UserCheck, Wifi, Network,
  Languages, PenLine, FileText, Download, Search, StickyNote,
  Mail, Users, Lock, Smartphone, RefreshCw, LayoutDashboard,
  Home, ClipboardList, LogOut,
} from 'lucide-react'
import { IsoSign } from '@/components/IsoSign'

const mockEntries = [
  { ref: 'LFS-2291', time: '05.05.26, 08:14', type: 'truck',   name: 'Tomasz Kowalski',  company: 'Nordwest Logistik',    plate: 'WA 4821 PL', flag: '🇵🇱', terminal: 'LKW Annahme',     checkout: null    as null | 'open' | string },
  { ref: 'SCH-8814', time: '05.05.26, 07:53', type: 'truck',   name: 'Stefan Müller',    company: 'Hansa Transport',      plate: 'MH-ST 882',  flag: '🇩🇪', terminal: 'LKW Annahme',     checkout: null    as null | 'open' | string },
  { ref: '—',        time: '05.05.26, 07:31', type: 'visitor', name: 'Gheorghe Ionescu', company: 'Trans Ro SRL',         plate: 'B 77 XYZ',   flag: '🇷🇴', terminal: 'Besucher Eingang', checkout: 'open'  as null | 'open' | string },
  { ref: 'NET-0041', time: '04.05.26, 16:44', type: 'service', name: 'Andriy Kovalenko', company: 'Bauer Servicetechnik', plate: 'HA-AK 201',  flag: '🇺🇦', terminal: 'LKW Annahme',     checkout: '15:50' as null | 'open' | string },
  { ref: 'GLS-7732', time: '04.05.26, 14:22', type: 'truck',   name: 'Mehmet Yilmaz',    company: 'Süd-Spedition',        plate: 'E-MY 5500',  flag: '🇹🇷', terminal: 'LKW Annahme',     checkout: null    as null | 'open' | string },
  { ref: 'LDL-0093', time: '04.05.26, 11:09', type: 'visitor', name: 'Jan Novák',        company: 'CZ-Logistik s.r.o.',   plate: 'PR 3341 C',  flag: '🇨🇿', terminal: 'Besucher Eingang', checkout: '16:53' as null | 'open' | string },
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
    nav: {
      login: 'Anmelden',
      register: 'Jetzt starten',
      demo: 'Demo anfragen',
      features: 'Funktionen',
      pricing: 'Preise',
      faq: 'FAQ',
    },
    hero: {
      eyebrow: 'Für Empfangs- und Werksleitung',
      title: 'Rechtssicherer Check-in — am Empfang und am Werkstor.',
      sub: 'GateSign Reception begrüßt Besucher und Servicekräfte. GateSign Logistik dokumentiert LKW-Fahrer und Lieferungen. Beides in einer Lösung — DSGVO-konform, in 10 Sprachen, ohne Empfangspersonal.',
      cta: '30 Tage kostenlos testen',
      demo: 'Demo anfragen',
      microtrust: 'Keine Einrichtungsgebühr · Keine Kreditkarte · Jederzeit kündbar',
    },
    trustedBy: {
      text: 'Entwickelt für Produktion, Logistik und Maschinenbau — in Deutschland, Österreich und der Schweiz.',
      industries: ['Produktion', 'Logistik', 'Maschinenbau', 'Baugewerbe', 'Großhandel'],
      dsgvo: ['DSGVO-konform', 'Server in der EU', 'AVV auf Anfrage'],
    },
    modules: {
      badge: 'Zwei Module',
      title: 'Für zwei Eingänge gebaut',
      sub: 'GateSign deckt zwei klar getrennte Anwendungsfälle ab — und beides läuft auf derselben Plattform.',
      ctaLink: '→',
      logistics: {
        brand: 'Logistik',
        title: 'Werkstor & Wareneingang',
        sub: 'Für LKW-Fahrer, Spediteure und externe Lieferungen.',
        points: [
          'Sicherheitsbelehrung in 10 Sprachen — auch für ausländische Fahrer',
          'Kennzeichen, Trailer, Referenz- und Lade-Nummer',
          '§ 12 ArbSchG und DGUV 1 dokumentiert',
          'Kein Personal am Tor nötig — Selbst-Check-in am Terminal',
        ],
        cta: 'Mehr zu Logistik',
        anchor: '#sicherheitsbelehrung',
      },
      reception: {
        brand: 'Reception',
        title: 'Besucher & Empfangsbereich',
        sub: 'Für Gäste, Kunden, Servicekräfte und Fremdfirmen.',
        points: [
          'Empfang ohne Empfangspersonal — automatischer Check-in',
          'Ansprechpartner direkt zuweisen, automatische Benachrichtigung',
          'Optional: Besucherkarten-Drucker als Add-on',
          'Live-Anwesenheit für Brandschutz und Evakuierung',
        ],
        cta: 'Mehr zu Reception',
        anchor: '#anwesenheit',
      },
    },
    products: {
      badge: 'Was drin ist',
      title: 'Vier Bausteine, eine Lösung',
      sub: 'Diese vier Bausteine nutzen Sie in beiden Modulen — Logistik wie Reception.',
      cardLink: 'Mehr erfahren →',
      cards: [
        {
          title: 'Sicherheitsbelehrung',
          desc: 'ISO-konforme Regeln in 10 Sprachen, digital unterschrieben, je Besuchertyp anders.',
          anchor: '#sicherheitsbelehrung',
        },
        {
          title: 'Live-Anwesenheit',
          desc: 'Echtzeit-Übersicht, wer gerade auf dem Gelände ist — wichtig im Notfall.',
          anchor: '#anwesenheit',
        },
        {
          title: 'Admin-Dashboard',
          desc: 'Alle Check-ins auf einen Blick, mit Filter, CSV-Export und revisionssicherem Audit-Log.',
          anchor: '#dashboard',
        },
        {
          title: 'Besucherkarten-Drucker',
          desc: 'Optionales Hardware-Bundle: Karte mit Nummer wird automatisch gedruckt — sichtbarer Ausweis im Werk.',
          anchor: '#drucker',
          tag: 'Add-on',
        },
      ],
    },
    featuresAll: {
      badge: 'Funktionsumfang',
      title: 'Alles, was Sie brauchen',
      sub: 'Über die Kern-Bausteine hinaus erfüllt GateSign Anforderungen aus Compliance, IT und Tagesgeschäft.',
      items: [
        '10 Sprachen mit automatischer Übersetzung',
        '28 ISO-Sicherheitsregeln + eigene Regeln',
        'Digitale Unterschrift mit Zeitstempel',
        'PDF-Belehrung je Besuchertyp',
        'CSV-Export bis 10.000 Einträge',
        'Suche, Filter und Sortierung',
        'Kontaktperson pro Eintrag hinterlegen',
        'Notizen pro Check-in',
        'Täglicher Compliance-Digest per E-Mail',
        'Multi-Standort und Multi-Terminal',
        'Team-Management mit Rollen',
        'Revisionssicheres Audit-Log',
        'DSGVO-konform, EU-Server, AVV auf Anfrage',
        'PWA — kein App-Store, kein IT-Setup',
        'Live-Update der Anwesenheitsliste alle 30 s',
      ],
    },
    stats: [
      { value: '10', label: 'Sprachen — kein Fahrer ohne Verständnis' },
      { value: '28', label: 'ISO-Regeln — sofort einsetzbar' },
      { value: '3',  label: 'Besuchertypen — getrennt belehrt' },
      { value: '30 s', label: 'Echtzeit-Update der Anwesenheitsliste' },
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
    addon: {
      badge: 'Add-on',
      title: 'Sichtbarkeit & Sicherheit im Werk',
      sub: 'Optionaler Etikettendrucker am Terminal. Bei jedem Check-in wird automatisch eine Besucherkarte mit großer Nummer, Name und Ansprechpartner gedruckt — passend zur Ausweishülle. Mitarbeiter erkennen sofort, wer registrierter Besucher ist.',
      stepsLabel: 'Ablauf',
      steps: [
        { title: 'Drucken', text: 'Beim Check-in druckt das Bundle automatisch eine Karte mit fortlaufender Tagesnummer und allen Besucherdaten.' },
        { title: 'Tragen', text: 'Der Besucher steckt die Karte in eine Ausweishülle und trägt sie sichtbar — Lanyard und Clip sind im Lieferumfang.' },
        { title: 'Checkout', text: 'Beim Verlassen tippt der Besucher seine Nummer am Terminal ein. Vergessener Checkout: Auto-Checkout zum Tagesende.' },
      ],
      reasonsTitle: 'Warum sich das Add-on lohnt',
      reasons: [
        { title: 'Sofort erkennbar', text: 'Mitarbeiter sehen auf einen Blick, wer ein registrierter Besucher ist und wer nicht zum Betrieb gehört.' },
        { title: 'Evakuierung sicher', text: 'Im Notfall stimmen Anwesenheitsliste und sichtbar getragene Karten überein — niemand wird vergessen.' },
        { title: 'Ohne Empfangspersonal', text: 'Der Ausweis wird automatisch erstellt — kein händisches Beschriften, keine Plastikkarten-Verwaltung.' },
      ],
      bundlesTitle: 'Zwei Bundle-Stufen',
      bundles: [
        {
          name: 'GateSign Print',
          tagline: 'Kompakt-Drucker im Bundle',
          desc: 'Für Empfang und Büros mit stabilem WLAN.',
          features: ['Etikettenformat ca. 88 × 55 mm', 'Schwarz + Rot, 300 dpi', 'USB + WLAN', 'Inkl. Startrolle und Ausweishüllen'],
        },
        {
          name: 'GateSign Print Pro',
          tagline: 'Industrie-Drucker mit Ethernet',
          desc: 'Für Werk, Lager und mehrere Standorte mit Netzwerk-Anschluss.',
          features: ['Etikettenformat ca. 88 × 55 mm', 'Schwarz + Rot, 300 dpi', 'USB + WLAN + Ethernet + Bluetooth', 'Status-Display am Drucker'],
        },
      ],
      pricingNote: 'Preis auf Anfrage. Hardware, Software-Add-on und Verbrauchsmaterial im Bundle.',
      cta: 'Angebot anfordern',
      cardMock: {
        label: 'Besucherkarte',
        company: 'Ihr Firmenlogo',
        numberLabel: 'Besuchernr.',
        nameLabel: 'Name',
        nameValue: 'Tomasz Kowalski',
        firmLabel: 'Firma',
        firmValue: 'Nordwest Logistik',
        hostLabel: 'Ansprechpartner',
        hostValue: 'A. Schneider',
        dateLabel: 'Check-in',
        dateValue: '19.05.26 · 08:14',
      },
    },
    mockup: {
      title: 'Alle Check-ins auf einen Blick',
      sub: 'Das Admin-Dashboard zeigt jeden Eintrag in Echtzeit — mit Besuchertyp, Terminal-Zuordnung, Belehrungsstatus und Abmeldung.',
      badge: 'Live-Vorschau',
      cols: ['Referenz', 'Zeit', 'Typ', 'Fahrer', 'Firma', 'Kennzeichen', 'Terminal', 'Spr.', 'Belehrung', 'Abmeld.'],
      accepted: 'Ja',
      entries: 'Einträge gesamt',
      entriesTitle: 'Check-in Einträge',
      refresh: 'Aktualisieren',
      csvExport: 'CSV Export',
      navEntries: 'Einträge',
      navInBuilding: 'Im Haus',
      navSettings: 'Einstellungen',
      navCompany: 'Demo GmbH',
      navTerminal: 'Terminal',
      logout: 'Abmelden',
      searchPlaceholder: 'Suche nach Name, Referenz oder Firma…',
      filterAll: 'Alle',
      filterTruck: 'LKW',
      filterVisitor: 'Besucher',
      filterService: 'Dienst',
      filterAllTerminals: 'Alle Terminals',
      entryCheckout: 'Abmelden',
    },
    dashboardFeatures: [
      'Echtzeit-Aktualisierung alle 30 Sekunden',
      'Suche nach Name, Firma, Kennzeichen',
      'Filter nach Besuchertyp & Sortierung nach jeder Spalte',
      'CSV-Export bis 10.000 Einträge (Excel-kompatibel)',
      'Eintragsdetails: Notiz, Unterschrift, PDF-Download & Druck',
      'Kontaktperson zuweisen pro Eintrag',
    ],
    pricing: {
      title: 'Transparente Preise',
      desc: 'Solo für einen Standort, Business für drei. Add-ons jederzeit modular dazubuchbar. Keine Einrichtungsgebühr · 14 Tage kostenlos · Jederzeit kündbar.',
      vat: 'Alle Preise zzgl. MwSt. · Monatlich oder jährlich (2 Monate gratis) · Kündigung jederzeit zum Monatsende',
      trial: '30 Tage kostenlos',
      support: 'Inkl. E-Mail-Support & Einrichtungshilfe',
      cta: 'Jetzt starten',
      contact: 'Kontakt aufnehmen',
      onRequest: 'Auf Anfrage',
      included: 'Enthalten:',
      popular: 'Beliebt',
      addonBadge: 'Hardware Add-on',
      addonTitle: 'Besucherkarten-Drucker',
      addonSub: 'Optional zu jedem Plan dazubuchbar. Drucker als Leihgerät, Verbrauchsmaterial und Software-Modul im Bundle.',
      addonPriceHint: 'Preis auf Anfrage',
      addonMore: 'Mehr Details',
      tiers: [
        {
          label: 'Solo',
          sublabel: '1 Terminal · 1 Standort',
          price: '29',
          period: 'pro Monat',
          desc: 'Für einen Standort mit einem Eingang.',
          features: [
            '1 Terminal',
            '1 Standort',
            'Check-in in 10 Sprachen + DeepL',
            'Dashboard & CSV-Export',
            'Daily-Digest E-Mail',
            'Audit-Log (DSGVO-konform)',
            'E-Mail-Support',
          ],
          highlight: false,
        },
        {
          label: 'Business',
          sublabel: '3 Terminals · 3 Standorte',
          price: '79',
          period: 'pro Monat',
          desc: 'Mehrere Eingänge oder Standorte — ein Paketpreis.',
          features: [
            '3 Terminals',
            '3 Standorte',
            'Alles aus Solo',
            'Audit-Export (Excel/CSV) inklusive',
            'Team-Management & Rollen',
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
            'Unbegrenzte Standorte',
            'Alle Add-ons inklusive',
            'Persönliches Onboarding',
            'SLA & dedizierter Support',
            'Schulung & Beratung',
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
          q: 'Brauche ich beide Module — Logistik und Reception?',
          a: 'Nein. Sie können nur Logistik (LKW-Anmeldung) oder nur Reception (Besucherempfang) nutzen — oder beide kombinieren. Die Konfiguration erfolgt im Admin-Bereich pro Besuchertyp. Der Preis bleibt gleich, beide Module sind im Abo enthalten.',
        },
        {
          q: 'Wie funktioniert das Drucker-Add-on?',
          a: 'Optional liefern wir einen Etikettendrucker im Bundle. Bei jedem Check-in druckt das Terminal automatisch eine Besucherkarte mit großer Nummer, Name und Ansprechpartner. Der Besucher trägt die Karte in einer Ausweishülle und checkt sich beim Verlassen per Nummer-Eingabe am Terminal aus. Vergessene Checkouts werden zum Tagesende automatisch geschlossen.',
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
      rights: '© 2026 Alpha Consult GmbH · GateSign',
      impressum: 'Impressum',
      datenschutz: 'Datenschutz',
      avv: 'AVV',
      contact: 'info@gatesign.de',
      mailSubject: 'Anfrage',
    },
    demo: {
      title: 'Demo anfragen',
      sub: 'Erzählen Sie uns kurz, was Sie sehen möchten — wir melden uns innerhalb von 24 Stunden.',
      name: 'Ihr Name',
      company: 'Firma',
      role: 'Funktion (z. B. Werkleiter, Sicherheitsbeauftragter)',
      email: 'Geschäftliche E-Mail',
      phone: 'Telefon (optional)',
      employees: 'Standorte mit Pförtner / Eingang',
      message: 'Was möchten Sie sehen? (optional)',
      submit: 'Anfrage senden',
      cancel: 'Abbrechen',
      privacy: 'Mit dem Absenden willigen Sie ein, dass wir Sie zur Demo kontaktieren. Keine Newsletter.',
      mailSubject: 'Demo-Anfrage GateSign',
      employeeOptions: ['1 Standort', '2–5 Standorte', '6–20 Standorte', 'Mehr als 20 Standorte'],
    },
  },
  en: {
    nav: {
      login: 'Log in',
      register: 'Get started',
      demo: 'Request demo',
      features: 'Features',
      pricing: 'Pricing',
      faq: 'FAQ',
    },
    hero: {
      eyebrow: 'For reception and plant management',
      title: 'Compliant check-in — at reception and at the gate.',
      sub: 'GateSign Reception welcomes guests and service staff. GateSign Logistics documents truck drivers and deliveries. Both in one solution — GDPR-compliant, 10 languages, no front-desk staff required.',
      cta: 'Try free for 30 days',
      demo: 'Request a demo',
      microtrust: 'No setup fee · No credit card · Cancel anytime',
    },
    trustedBy: {
      text: 'Built for production, logistics and mechanical engineering — in Germany, Austria and Switzerland.',
      industries: ['Production', 'Logistics', 'Engineering', 'Construction', 'Wholesale'],
      dsgvo: ['GDPR-compliant', 'EU servers', 'DPA available'],
    },
    modules: {
      badge: 'Two modules',
      title: 'Built for two entrances',
      sub: 'GateSign covers two clearly separated use cases — both running on the same platform.',
      ctaLink: '→',
      logistics: {
        brand: 'Logistics',
        title: 'Gate & goods receiving',
        sub: 'For truck drivers, hauliers and external deliveries.',
        points: [
          'Safety briefing in 10 languages — also for foreign drivers',
          'Licence plate, trailer, reference and load number',
          'Documented per § 12 ArbSchG and DGUV 1',
          'No staff needed at the gate — self check-in at the terminal',
        ],
        cta: 'More on Logistics',
        anchor: '#sicherheitsbelehrung',
      },
      reception: {
        brand: 'Reception',
        title: 'Visitors & front desk',
        sub: 'For guests, customers, service staff and external contractors.',
        points: [
          'Reception without front-desk staff — automatic check-in',
          'Assign host directly, automatic notification',
          'Optional: visitor-card printer as an add-on',
          'Live presence list for fire safety and evacuation',
        ],
        cta: 'More on Reception',
        anchor: '#anwesenheit',
      },
    },
    products: {
      badge: 'What you get',
      title: 'Four building blocks, one solution',
      sub: 'These four building blocks are used in both modules — Logistics and Reception.',
      cardLink: 'Learn more →',
      cards: [
        {
          title: 'Safety briefing',
          desc: 'ISO-compliant rules in 10 languages, signed digitally, separate per visitor type.',
          anchor: '#sicherheitsbelehrung',
        },
        {
          title: 'Live presence',
          desc: 'Real-time overview of who is currently on site — critical in an emergency.',
          anchor: '#anwesenheit',
        },
        {
          title: 'Admin dashboard',
          desc: 'All check-ins at a glance, with filters, CSV export and a tamper-proof audit log.',
          anchor: '#dashboard',
        },
        {
          title: 'Visitor-card printer',
          desc: 'Optional hardware bundle: numbered card is printed automatically — visible badge on site.',
          anchor: '#drucker',
          tag: 'Add-on',
        },
      ],
    },
    featuresAll: {
      badge: 'Feature set',
      title: 'Everything you need',
      sub: 'Beyond the core building blocks, GateSign meets requirements from compliance, IT and day-to-day operations.',
      items: [
        '10 languages with automatic translation',
        '28 ISO safety rules + your own rules',
        'Digital signature with timestamp',
        'PDF briefing per visitor type',
        'CSV export up to 10,000 entries',
        'Search, filter and sorting',
        'Contact person per entry',
        'Notes on every check-in',
        'Daily compliance digest by email',
        'Multi-site and multi-terminal',
        'Team management with roles',
        'Tamper-proof audit log',
        'GDPR-compliant, EU servers, DPA available',
        'PWA — no app store, no IT setup',
        'Live presence updates every 30 s',
      ],
    },
    stats: [
      { value: '10', label: 'Languages — no driver left without understanding' },
      { value: '28', label: 'ISO rules — ready to use immediately' },
      { value: '3',  label: 'Visitor types — briefed separately' },
      { value: '30 s', label: 'Real-time presence-list refresh' },
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
    addon: {
      badge: 'Add-on',
      title: 'Visibility & safety on site',
      sub: 'Optional badge printer at the terminal. On every check-in, a visitor card is printed automatically — with a large number, name and host. Staff can tell registered visitors apart from anyone else at a glance.',
      stepsLabel: 'How it works',
      steps: [
        { title: 'Print', text: 'At check-in, the bundle prints a card automatically — running daily number plus all visitor details.' },
        { title: 'Wear', text: 'The visitor slips the card into a badge holder and wears it visibly — lanyard and clip are included.' },
        { title: 'Check out', text: 'On leaving, the visitor enters their number at the terminal. Forgotten check-outs auto-close at end of day.' },
      ],
      reasonsTitle: 'Why the add-on pays off',
      reasons: [
        { title: 'Instantly recognisable', text: 'Staff see at a glance who is a registered visitor and who does not belong on the premises.' },
        { title: 'Evacuation-ready', text: 'In an emergency, the on-site list and visibly worn cards match — no one gets missed.' },
        { title: 'No reception required', text: 'The badge is created automatically — no manual labelling, no plastic-card management.' },
      ],
      bundlesTitle: 'Two bundle tiers',
      bundles: [
        {
          name: 'GateSign Print',
          tagline: 'Compact printer bundle',
          desc: 'For reception desks and offices with reliable Wi-Fi.',
          features: ['Label size approx. 88 × 55 mm', 'Black + red, 300 dpi', 'USB + Wi-Fi', 'Includes starter roll and badge holders'],
        },
        {
          name: 'GateSign Print Pro',
          tagline: 'Industrial printer with Ethernet',
          desc: 'For plants, warehouses and multi-site setups with wired network.',
          features: ['Label size approx. 88 × 55 mm', 'Black + red, 300 dpi', 'USB + Wi-Fi + Ethernet + Bluetooth', 'Status display on the printer'],
        },
      ],
      pricingNote: 'Pricing on request. Hardware, software add-on and consumables in one bundle.',
      cta: 'Request a quote',
      cardMock: {
        label: 'Visitor card',
        company: 'Your company logo',
        numberLabel: 'Visitor no.',
        nameLabel: 'Name',
        nameValue: 'Tomasz Kowalski',
        firmLabel: 'Company',
        firmValue: 'Nordwest Logistik',
        hostLabel: 'Host',
        hostValue: 'A. Schneider',
        dateLabel: 'Check-in',
        dateValue: '19.05.26 · 08:14',
      },
    },
    mockup: {
      title: 'All check-ins at a glance',
      sub: 'The admin dashboard shows every entry in real time — with visitor type, terminal, briefing status and check-out.',
      badge: 'Live preview',
      cols: ['Reference', 'Time', 'Type', 'Driver', 'Company', 'Plate', 'Terminal', 'Lang.', 'Briefing', 'Check-out'],
      accepted: 'Yes',
      entries: 'entries total',
      entriesTitle: 'Check-in Entries',
      refresh: 'Refresh',
      csvExport: 'CSV export',
      navEntries: 'Entries',
      navInBuilding: 'On site',
      navSettings: 'Settings',
      navCompany: 'Demo Ltd.',
      navTerminal: 'Terminal',
      logout: 'Log out',
      searchPlaceholder: 'Search by name, reference or company…',
      filterAll: 'All',
      filterTruck: 'Truck',
      filterVisitor: 'Visitor',
      filterService: 'Contractor',
      filterAllTerminals: 'All terminals',
      entryCheckout: 'Check out',
    },
    dashboardFeatures: [
      'Real-time updates every 30 seconds',
      'Search by name, company or licence plate',
      'Filter by visitor type & sort by any column',
      'CSV export up to 10,000 entries (Excel-compatible)',
      'Entry details: notes, signature, PDF download & print',
      'Assign a contact person per entry',
    ],
    pricing: {
      title: 'Transparent pricing',
      desc: 'Solo for one site, Business for three. Add-ons modular at any time. No setup fee · 14 days free · Cancel anytime.',
      vat: 'All prices excl. VAT · Monthly or yearly (2 months free) · Cancel anytime at end of month',
      trial: '30 days free',
      support: 'Incl. email support & onboarding help',
      cta: 'Get started',
      contact: 'Contact us',
      onRequest: 'On request',
      included: 'Included:',
      popular: 'Popular',
      addonBadge: 'Hardware add-on',
      addonTitle: 'Visitor-card printer',
      addonSub: 'Optional with any plan. Printer as a rental, consumables and software module included in the bundle.',
      addonPriceHint: 'Pricing on request',
      addonMore: 'Details',
      tiers: [
        {
          label: 'Solo',
          sublabel: '1 Terminal · 1 Location',
          price: '29',
          period: 'per month',
          desc: 'Ideal for one location with a single entrance.',
          features: [
            '1 terminal',
            '1 location',
            'Check-in in 10 languages + DeepL',
            'Dashboard & CSV export',
            'Daily-digest email',
            'Audit log (GDPR-compliant)',
            'Email support',
          ],
          highlight: false,
        },
        {
          label: 'Business',
          sublabel: '3 Terminals · 3 Locations',
          price: '79',
          period: 'per month',
          desc: 'Multiple entrances or locations — one flat rate.',
          features: [
            '3 terminals',
            '3 locations',
            'Everything in Solo',
            'Audit export (Excel/CSV) included',
            'Team management & roles',
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
            'Unlimited locations',
            'All add-ons included',
            'Personal onboarding',
            'SLA & dedicated support',
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
          q: 'Do I need both modules — Logistics and Reception?',
          a: 'No. You can use only Logistics (truck check-in), only Reception (visitor check-in), or combine both. Configuration happens in the admin area per visitor type. The price stays the same — both modules are included in the subscription.',
        },
        {
          q: 'How does the printer add-on work?',
          a: 'We optionally provide a label printer as part of the bundle. On every check-in, the terminal prints a visitor card with a large number, name and host. The visitor wears the card in a holder and checks out at the terminal by entering the number. Forgotten check-outs are closed automatically at the end of the day.',
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
      rights: '© 2026 Alpha Consult GmbH · GateSign',
      impressum: 'Impressum',
      datenschutz: 'Privacy Policy',
      avv: 'DPA',
      contact: 'info@gatesign.de',
      mailSubject: 'Inquiry',
    },
    demo: {
      title: 'Request a demo',
      sub: 'Tell us briefly what you\'d like to see — we\'ll get back to you within 24 hours.',
      name: 'Your name',
      company: 'Company',
      role: 'Role (e.g. plant manager, safety officer)',
      email: 'Work email',
      phone: 'Phone (optional)',
      employees: 'Sites with reception / entrance',
      message: 'What would you like to see? (optional)',
      submit: 'Send request',
      cancel: 'Cancel',
      privacy: 'By submitting you agree to be contacted about the demo. No newsletter.',
      mailSubject: 'GateSign demo request',
      employeeOptions: ['1 site', '2–5 sites', '6–20 sites', 'More than 20 sites'],
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

type AddonCard = (typeof content)['de']['addon']['cardMock']

function PrinterCardMockup({ card }: { card: AddonCard }) {
  return (
    <div className="relative">
      {/* Card body — Querformat 88 × 55 mm (Visitenkartenformat) */}
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-80 sm:w-96 rotate-[-3deg] hover:rotate-0 transition-transform duration-500"
        style={{ aspectRatio: '88 / 55' }}
      >
        <div className="h-full p-4 flex flex-col">
          {/* Header: Logo + Label */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="h-5 w-20 bg-slate-100 rounded flex items-center justify-center">
              <span className="text-[8px] text-slate-400 uppercase tracking-wider truncate">{card.company}</span>
            </div>
            <span className="text-[8px] text-slate-300 uppercase tracking-widest font-semibold">{card.label}</span>
          </div>

          {/* Body: Nummer links, Daten rechts */}
          <div className="flex-1 flex items-center gap-4 py-2 min-h-0">
            <div className="flex-shrink-0 flex flex-col items-center justify-center pr-4 border-r border-slate-100">
              <p className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">{card.numberLabel}</p>
              <p className="text-5xl font-black text-red-600 tabular-nums leading-none">762</p>
            </div>
            <div className="flex-1 min-w-0 space-y-1.5">
              <div>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider">{card.nameLabel}</p>
                <p className="text-sm font-bold text-slate-900 leading-tight truncate">{card.nameValue}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider">{card.firmLabel}</p>
                <p className="text-xs text-slate-700 leading-tight truncate">{card.firmValue}</p>
              </div>
              <div>
                <p className="text-[8px] text-slate-400 uppercase tracking-wider">{card.hostLabel}</p>
                <p className="text-xs text-slate-700 leading-tight truncate">{card.hostValue}</p>
              </div>
            </div>
          </div>

          {/* Footer: Datum */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">{card.dateLabel}</p>
            <p className="text-[10px] text-slate-600 tabular-nums">{card.dateValue}</p>
          </div>
        </div>
      </div>

      {/* Soft shadow under card */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-6 bg-slate-900/15 blur-2xl rounded-full" />
    </div>
  )
}

type DemoTexts = (typeof content)['de']['demo']

function DemoModal({ open, onClose, lang, texts }: {
  open: boolean
  onClose: () => void
  lang: 'de' | 'en'
  texts: DemoTexts
}) {
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    const form = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/contact-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          company: form.get('company'),
          role: form.get('role'),
          email: form.get('email'),
          phone: form.get('phone'),
          sites: form.get('sites'),
          message: form.get('message'),
          lang,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(typeof data?.error === 'string' ? data.error : 'Fehler beim Senden.')
        setSubmitting(false)
        return
      }
      setSuccess(true)
    } catch {
      setError(lang === 'de' ? 'Netzwerkfehler. Bitte erneut versuchen.' : 'Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="absolute top-4 right-4 w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors z-10"
        >
          <X className="w-5 h-5" strokeWidth={2} />
        </button>

        {success ? (
          <div className="px-8 py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 mx-auto mb-5 flex items-center justify-center">
              <Check className="w-7 h-7 text-emerald-600" strokeWidth={2.5} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              {lang === 'de' ? 'Anfrage gesendet' : 'Request sent'}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed mb-6">
              {lang === 'de'
                ? 'Vielen Dank. Wir melden uns innerhalb von 24 Stunden bei Ihnen.'
                : 'Thank you. We\'ll get back to you within 24 hours.'}
            </p>
            <button
              type="button"
              onClick={onClose}
              className="text-sm bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition-colors font-medium"
            >
              {lang === 'de' ? 'Schließen' : 'Close'}
            </button>
          </div>
        ) : (
          <>
            <div className="px-7 pt-7 pb-4 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-1">{texts.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{texts.sub}</p>
            </div>
            <form onSubmit={handleSubmit} className="px-7 py-5 space-y-3.5 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field name="name" label={texts.name} required />
                <Field name="company" label={texts.company} required />
              </div>
              <Field name="role" label={texts.role} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field name="email" label={texts.email} type="email" required />
                <Field name="phone" label={texts.phone} type="tel" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{texts.employees}</label>
                <select
                  name="sites"
                  defaultValue=""
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:border-slate-900 focus:outline-none bg-white"
                >
                  <option value="" disabled>—</option>
                  {texts.employeeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">{texts.message}</label>
                <textarea
                  name="message"
                  rows={3}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:border-slate-900 focus:outline-none resize-none"
                />
              </div>

              {error && (
                <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </div>
              )}

              <p className="text-xs text-slate-400 leading-relaxed pt-1">{texts.privacy}</p>

              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-sm font-medium text-slate-500 hover:text-slate-900 px-5 py-2.5 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  {texts.cancel}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="text-sm font-semibold bg-slate-900 text-white px-6 py-2.5 rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (lang === 'de' ? 'Sende…' : 'Sending…') : texts.submit}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

function Field({ name, label, type = 'text', required }: {
  name: string
  label: string
  type?: string
  required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:border-slate-900 focus:outline-none"
      />
    </div>
  )
}

export default function LandingPage() {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [demoOpen, setDemoOpen] = useState(false)
  const t = content[lang]
  const badges = typeBadge[lang]

  const openDemo = () => setDemoOpen(true)

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight">GateSign</Link>

          <div className="hidden md:flex items-center gap-7">
            <a href="#funktionen" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
              {t.nav.features}
            </a>
            <a href="#pricing" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
              {t.nav.pricing}
            </a>
            <a href="#faq" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
              {t.nav.faq}
            </a>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLang(lang === 'de' ? 'en' : 'de')}
              className="text-sm text-slate-400 hover:text-slate-700 transition-colors font-medium px-2"
            >
              {lang === 'de' ? 'EN' : 'DE'}
            </button>
            <button
              type="button"
              onClick={openDemo}
              className="hidden sm:block text-sm text-slate-500 hover:text-slate-900 transition-colors font-medium"
            >
              {t.nav.demo}
            </button>
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
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12 lg:gap-16">
              {/* Left: Text */}
              <div className="flex-1 text-center md:text-left">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-5 uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  {t.hero.eyebrow}
                </p>
                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-5">
                  {t.hero.title}
                </h1>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed md:max-w-xl mx-auto md:mx-0">
                  {t.hero.sub}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link
                    href="/register"
                    className="inline-block bg-slate-900 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-slate-700 transition-colors"
                  >
                    {t.hero.cta} →
                  </Link>
                  <button
                    type="button"
                    onClick={openDemo}
                    className="inline-block text-slate-700 text-base font-semibold px-8 py-4 rounded-xl border border-slate-300 hover:border-slate-900 hover:text-slate-900 transition-colors"
                  >
                    {t.hero.demo}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-5 leading-relaxed">
                  {t.hero.microtrust}
                </p>
              </div>
              {/* Right: Terminal mockup — visible from md upwards */}
              <div className="flex-shrink-0 hidden md:block">
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

      {/* Zwei Module — Logistik + Reception */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-slate-900 text-white px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.modules.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.modules.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.modules.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: <Building2 className="w-6 h-6 text-slate-700" strokeWidth={1.75} />, mod: t.modules.reception },
              { icon: <Truck     className="w-6 h-6 text-slate-700" strokeWidth={1.75} />, mod: t.modules.logistics },
            ].map((m, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {m.icon}
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">GateSign</p>
                    <p className="text-lg font-bold text-slate-900 leading-tight">{m.mod.brand}</p>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 leading-snug">{m.mod.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-5">{m.mod.sub}</p>
                <ul className="space-y-3 mb-6 flex-1">
                  {m.mod.points.map((point, pi) => (
                    <li key={pi} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-emerald-600" strokeWidth={3} />
                      </div>
                      <span className="text-sm text-slate-700 leading-snug">{point}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={m.mod.anchor}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900 hover:text-slate-700 transition-colors"
                >
                  {m.mod.cta}
                  <span aria-hidden>→</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products — Kernbausteine */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.products.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.products.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.products.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              { icon: <ShieldCheck      className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, card: t.products.cards[0] },
              { icon: <Eye              className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, card: t.products.cards[1] },
              { icon: <LayoutDashboard  className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, card: t.products.cards[2] },
              { icon: <Printer          className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, card: t.products.cards[3] },
            ].map((p, i) => (
              <a
                key={i}
                href={p.card.anchor}
                className="group bg-white border border-slate-200 rounded-2xl p-6 hover:border-slate-900 hover:shadow-md transition-all flex flex-col"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center">
                    {p.icon}
                  </div>
                  {(p.card as { tag?: string }).tag && (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {(p.card as { tag?: string }).tag}
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug">{p.card.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed flex-1">{p.card.desc}</p>
                <span className="text-sm font-semibold text-slate-900 mt-4 group-hover:underline">
                  {t.products.cardLink}
                </span>
              </a>
            ))}
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

      {/* Safety Briefing Section */}
      <a id="funktionen" aria-hidden="true" />
      <section id="sicherheitsbelehrung" className="max-w-5xl mx-auto px-6 py-20">
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

      {/* Im Haus — Anwesenheit */}
      <section id="anwesenheit" className="max-w-5xl mx-auto px-6 py-20">
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

      {/* Dashboard Mockup */}
      <section id="dashboard" className="bg-slate-50 py-20">
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
            <div className="bg-white border-b border-slate-100 px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <span className="font-bold text-slate-900 text-sm">GateSign</span>
                <div className="flex gap-1">
                  <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                    <ClipboardList className="w-3.5 h-3.5" strokeWidth={2} />
                    {t.mockup.navEntries}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-lg">
                    <Home className="w-3.5 h-3.5" strokeWidth={2} />
                    {t.mockup.navInBuilding}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-slate-500 text-xs font-medium px-3 py-1.5 rounded-lg">
                    <Settings className="w-3.5 h-3.5" strokeWidth={2} />
                    {t.mockup.navSettings}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-500 font-medium">{t.mockup.navCompany}</span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                  <Tablet className="w-3.5 h-3.5" strokeWidth={2} />
                  {t.mockup.navTerminal}
                  <ChevronDown className="w-3 h-3" strokeWidth={2} />
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                  <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
                  {t.mockup.logout}
                </span>
              </div>
            </div>
            {/* Table */}
            <div className="bg-white">
              <div className="px-6 py-5 flex items-center justify-between border-b border-slate-50">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{t.mockup.entriesTitle}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{mockEntries.length} {t.mockup.entries}</p>
                </div>
                <div className="flex gap-2">
                  <button className="inline-flex items-center gap-1.5 text-xs border border-slate-200 text-slate-600 px-3 py-2 rounded-lg pointer-events-none font-medium">
                    <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
                    {t.mockup.refresh}
                  </button>
                  <button className="inline-flex items-center gap-1.5 text-xs bg-slate-900 text-white px-3 py-2 rounded-lg pointer-events-none font-medium">
                    <Download className="w-3.5 h-3.5" strokeWidth={2} />
                    {t.mockup.csvExport}
                  </button>
                </div>
              </div>

              {/* Search bar */}
              <div className="px-6 pt-4">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={2} />
                  <span className="text-xs text-slate-400">{t.mockup.searchPlaceholder}</span>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="px-6 pt-3 pb-4 flex flex-wrap items-center gap-2">
                <span className="bg-slate-900 text-white text-[11px] font-semibold px-3 py-1 rounded-full">{t.mockup.filterAll}</span>
                <span className="border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full">{t.mockup.filterTruck}</span>
                <span className="border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full">{t.mockup.filterVisitor}</span>
                <span className="border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full">{t.mockup.filterService}</span>
                <span className="ml-4 bg-violet-600 text-white text-[11px] font-semibold px-3 py-1 rounded-full">{t.mockup.filterAllTerminals}</span>
                <span className="border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full">LKW Annahme</span>
                <span className="border border-slate-200 text-slate-600 text-[11px] font-medium px-3 py-1 rounded-full">Besucher Eingang</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-y border-slate-100 bg-slate-50/50">
                      {t.mockup.cols.map((col, ci) => (
                        <th key={ci} className="text-left px-4 py-3 text-slate-400 font-semibold uppercase tracking-wide whitespace-nowrap text-[10px]">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mockEntries.map((row, i) => (
                      <tr key={i} className="border-b border-slate-50 last:border-b-0">
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
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{row.terminal}</td>
                        <td className="px-4 py-3 text-base">{row.flag}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap">
                            <Check className="w-3 h-3" strokeWidth={3} />
                            {t.mockup.accepted}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {row.checkout === 'open' ? (
                            <span className="inline-flex items-center gap-1 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md text-xs font-medium">
                              <LogOut className="w-3 h-3" strokeWidth={2} />
                              {t.mockup.entryCheckout}
                            </span>
                          ) : row.checkout && row.checkout !== 'open' ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700 text-xs font-medium tabular-nums">
                              <Check className="w-3 h-3" strokeWidth={3} />
                              {row.checkout}
                            </span>
                          ) : (
                            <span className="text-slate-300">—</span>
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

      {/* Add-on: Besucherkarten-Drucker */}
      <section id="drucker" className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          {/* Header */}
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              <Printer className="w-3.5 h-3.5" strokeWidth={2} />
              {t.addon.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.addon.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.addon.sub}</p>
          </div>

          {/* Steps + Card mockup */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-6">
                {t.addon.stepsLabel}
              </p>
              <div className="space-y-6">
                {t.addon.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
                      {i + 1}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="font-semibold text-slate-900 mb-1">{step.title}</p>
                      <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center py-6 lg:py-0">
              <PrinterCardMockup card={t.addon.cardMock} />
            </div>
          </div>

          {/* Reasons grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
            {[
              { icon: <Eye className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, item: t.addon.reasons[0] },
              { icon: <ShieldCheck className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, item: t.addon.reasons[1] },
              { icon: <UserCheck className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, item: t.addon.reasons[2] },
            ].map((r, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center mb-4">
                  {r.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug">{r.item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{r.item.text}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-4">
            <p className="text-sm text-slate-400 mb-5">{t.addon.pricingNote}</p>
            <button
              type="button"
              onClick={openDemo}
              className="inline-block bg-slate-900 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-slate-700 transition-colors"
            >
              {t.addon.cta} →
            </button>
          </div>
        </div>
      </section>

      {/* Alle Features */}
      <section className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.featuresAll.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.featuresAll.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.featuresAll.sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              <Languages   key="i0"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <ShieldCheck key="i1"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <PenLine     key="i2"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <FileText    key="i3"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Download    key="i4"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Search      key="i5"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <UserCheck   key="i6"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <StickyNote  key="i7"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Mail        key="i8"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Building2   key="i9"  className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Users       key="i10" className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Lock        key="i11" className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Server      key="i12" className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <Smartphone  key="i13" className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
              <RefreshCw   key="i14" className="w-4 h-4 text-slate-600" strokeWidth={1.75} />,
            ].map((icon, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                  {icon}
                </div>
                <span className="text-sm text-slate-700 leading-snug">{t.featuresAll.items[i]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Legal Section — Gesetzliche Pflicht */}
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

      {/* Pricing */}
      <section id="pricing" className="bg-slate-50 py-20">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold mb-4">{t.pricing.title}</h2>
          <p className="text-sm text-slate-400 mb-10">{t.pricing.desc}</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {t.pricing.tiers.map((tier, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-7 border flex flex-col text-left ${
                  tier.highlight
                    ? 'bg-slate-900 border-slate-900 text-white shadow-lg md:-mt-2 md:mb-2'
                    : 'bg-white border-slate-200'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-emerald-500 text-white px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
                    {t.pricing.popular}
                  </div>
                )}
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
                  <button
                    type="button"
                    onClick={openDemo}
                    className="block w-full font-semibold py-3 rounded-xl transition-colors text-sm text-center bg-slate-900 text-white hover:bg-slate-700"
                  >
                    {t.pricing.contact}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Hardware Add-on — Drucker-Bundles */}
          <div className="mt-16 pt-12 border-t border-slate-200">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-100 text-amber-700 px-3 py-1 rounded-full mb-3 uppercase tracking-wide">
                <Printer className="w-3.5 h-3.5" strokeWidth={2} />
                {t.pricing.addonBadge}
              </span>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{t.pricing.addonTitle}</h3>
              <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">{t.pricing.addonSub}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-3xl mx-auto text-left">
              {[
                { icon: <Wifi    className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, bundle: t.addon.bundles[0] },
                { icon: <Network className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, bundle: t.addon.bundles[1] },
              ].map((b, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0">
                      {b.icon}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900 leading-tight">{b.bundle.name}</p>
                      <p className="text-xs text-slate-500">{b.bundle.tagline}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-5 flex-1">
                    {b.bundle.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-1" strokeWidth={2.5} />
                        <span className="text-sm text-slate-700 leading-snug">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <span className="text-sm font-semibold text-slate-900">{t.pricing.addonPriceHint}</span>
                    <a href="#drucker" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors">
                      {t.pricing.addonMore} <span aria-hidden>→</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-8 max-w-2xl mx-auto leading-relaxed">
            {t.pricing.vat}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
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
            <button
              type="button"
              onClick={openDemo}
              className="inline-block text-slate-400 text-base font-medium px-8 py-4 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
            >
              {t.finalCta.demo}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-slate-400">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span>{t.footer.rights}</span>
            <a
              href={`mailto:${t.footer.contact}?subject=${encodeURIComponent(t.footer.mailSubject)}`}
              className="hover:text-slate-600 transition-colors"
            >
              {t.footer.contact}
            </a>
          </div>
          <div className="flex gap-5">
            <Link href="/impressum" className="hover:text-slate-600 transition-colors">{t.footer.impressum}</Link>
            <Link href="/datenschutz" className="hover:text-slate-600 transition-colors">{t.footer.datenschutz}</Link>
            <Link href="/avv" className="hover:text-slate-600 transition-colors">{t.footer.avv}</Link>
          </div>
        </div>
      </footer>

      <DemoModal open={demoOpen} onClose={() => setDemoOpen(false)} lang={lang} texts={t.demo} />
    </div>
  )
}
