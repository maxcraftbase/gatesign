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
  AlertTriangle, FileWarning, Gavel,
  Calendar, Sparkles, Headphones, Palette, MapPin,
  ArrowRight, Clock,
} from 'lucide-react'

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
  truck:   'bg-amber-50 text-amber-800 border border-amber-100',
  visitor: 'bg-indigo-50 text-indigo-800 border border-indigo-100',
  service: 'bg-violet-50 text-violet-800 border border-violet-100',
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
      register: 'Loslegen',
      demo: 'Demo anfragen',
      features: 'Funktionen',
      pricing: 'Preise',
      faq: 'FAQ',
    },
    hero: {
      eyebrow: 'Compliance · Werkstor · Empfang',
      title: 'Jeder Besucher belehrt. Jede Anlieferung dokumentiert. Jeder Audit bestanden.',
      sub: 'GateSign ist das Selbstbedienungs-Terminal für Werkstor und Empfang. Sicherheitsbelehrung in zehn Sprachen, digitale Unterschrift, revisionssicheres Audit-Log. § 12 ArbSchG und DGUV V1 erfüllt — in dreißig Minuten live, ohne IT-Projekt.',
      cta: 'Loslegen',
      demo: 'Demo anfragen',
      microtrust: 'Keine Einrichtungsgebühr · DSGVO-konform, Server in der EU · Setup in unter 30 Minuten',
    },
    trustedBy: {
      text: 'Für Produktion, Logistik und Maschinenbau im DACH-Mittelstand.',
      industries: ['Produktion', 'Logistik', 'Maschinenbau', 'Baugewerbe', 'Großhandel'],
      dsgvo: ['DSGVO-konform', 'Server in der EU', 'AVV auf Anfrage'],
    },
    pain: {
      badge: 'Darum jetzt',
      title: 'Was passiert, wenn morgen jemand fragt?',
      sub: 'Drei Szenarien aus dem DACH-Mittelstand — und was Sie heute zur Hand hätten, wenn GateSign am Eingang läuft.',
      items: [
        {
          trigger: 'Die Berufsgenossenschaft kündigt einen Audit an.',
          status: 'Heute: Excel-Liste, Klemmbrett, ein paar PDFs.',
          relief: 'Mit GateSign: vollständiger Audit-Export per Klick — jeder Besucher, jede Belehrung, jede Unterschrift mit Zeitstempel.',
        },
        {
          trigger: 'Ein Fremdmonteur verletzt sich auf Ihrem Gelände.',
          status: 'Heute: niemand weiß, ob er belehrt war und welche Regeln galten.',
          relief: 'Mit GateSign: Nachweis liegt vor — Sprache, Regelwerk, Unterschrift, gespeichert revisionssicher.',
        },
        {
          trigger: 'Eine DSGVO-Beschwerde landet auf Ihrem Tisch.',
          status: 'Heute: Papier-Listen mit Klarnamen liegen offen am Empfang.',
          relief: 'Mit GateSign: Daten EU-gespeichert, AVV-Click-Wrap dokumentiert, Auskunft und Löschung per Knopfdruck.',
        },
      ],
    },
    modules: {
      badge: 'Zwei Eingänge',
      title: 'Für Werkstor und Empfang gebaut',
      sub: 'GateSign deckt zwei klar getrennte Anwendungsfälle ab — beides auf einer Plattform, in einem Abo.',
      reception: {
        brand: 'Reception',
        title: 'Besucher und Empfangsbereich',
        sub: 'Für Gäste, Kunden, Servicekräfte und Fremdfirmen.',
        points: [
          'Empfang ohne Empfangspersonal — Self-Check-in am Tablet',
          'Ansprechpartner direkt zuweisen, automatische Benachrichtigung',
          'Optional Besucherkarte mit Tagesnummer per Drucker-Add-on',
          'Live-Anwesenheit für Brandschutz und Evakuierung',
        ],
        cta: 'Mehr zu Reception',
        anchor: '#anwesenheit',
      },
      logistics: {
        brand: 'Logistik',
        title: 'Werkstor und Wareneingang',
        sub: 'Für LKW-Fahrer, Spediteure und externe Lieferungen.',
        points: [
          'Sicherheitsbelehrung in zehn Sprachen — auch für ausländische Fahrer',
          'Kennzeichen, Trailer, Referenz- und Lade-Nummer',
          '§ 12 ArbSchG und DGUV V1 dokumentiert',
          'Kein Personal am Tor nötig — Selbst-Check-in am Terminal',
        ],
        cta: 'Mehr zu Logistik',
        anchor: '#sicherheitsbelehrung',
      },
    },
    how: {
      badge: 'In 30 Minuten live',
      title: 'So funktioniert GateSign',
      sub: 'Drei Setup-Schritte. Kein App-Store, kein IT-Projekt, kein Personal am Eingang.',
      steps: [
        { title: 'Konfigurieren', text: 'Sicherheitsregeln, Betriebszeiten und Belehrungstexte im Admin-Bereich anlegen — Vorlagen für Logistik und Reception inklusive.' },
        { title: 'Terminal aufstellen', text: 'Handelsübliches Android- oder iPad-Tablet am Eingang platzieren. GateSign läuft als PWA — kein App-Store, keine Installation.' },
        { title: 'Einchecken lassen', text: 'Besucher wählt Sprache, bestätigt die Regeln, unterschreibt digital. Sie bekommen den Eintrag in Echtzeit ins Dashboard.' },
      ],
      terminalSteps: ['Sprache wählen', 'Besuchertyp wählen', 'Daten eingeben', 'Belehrung bestätigen', 'Unterschreiben'],
      terminalLabel: 'Ablauf am Terminal',
    },
    briefing: {
      badge: 'Sicherheitsbelehrung',
      title: 'Belehrung in der Sprache des Empfängers — automatisch.',
      sub: 'Jeder Besucher sieht die Sicherheitsregeln in seiner eigenen Sprache. Sie wählen die Regeln einmal aus, GateSign übersetzt automatisch und speichert jede Unterschrift revisionssicher.',
      points: [
        { title: '28 ISO-Sicherheitsregeln', text: 'Vordefinierte Regeln: Warnweste, Staplerverkehr, Zutrittsverbote, Videoüberwachung, Motor aus — sofort einsatzbereit. Eigene Regeln ergänzen Sie in zwei Klicks.' },
        { title: 'PDF-Belehrung pro Besuchertyp', text: 'Eigene Belehrung für LKW-Fahrer, Besucher und Dienstleister — jeder bekommt nur, was für ihn gilt.' },
        { title: 'Digitale Unterschrift mit Zeitstempel', text: 'Rechtssichere Bestätigung am Terminal. Jede Signatur mit Zeitstempel, Gerätekennung und IP gespeichert.' },
        { title: 'Zehn Sprachen', text: 'Deutsch, Englisch, Polnisch, Rumänisch, Ukrainisch, Türkisch, Tschechisch, Ungarisch, Bulgarisch, Russisch.' },
      ],
      rulesActive: 'Sicherheitsregeln — aktiv',
      rulesStatus: '6 Regeln aktiv · automatisch übersetzt',
    },
    proof: {
      badge: 'Beweis im Audit-Fall',
      title: 'Drei Werkzeuge, ein revisionssicherer Vorgang',
      sub: 'Was Sie der Berufsgenossenschaft, dem Datenschutzbeauftragten und der Versicherung in einer Audit-Situation vorlegen — auf Knopfdruck.',
      cards: [
        {
          tab: 'Audit-Log',
          title: 'Revisionssichere Historie',
          desc: 'Jeder Check-in, jede Unterschrift, jeder Logout — versioniert, mit Zeitstempel und Gerätekennung. Export als Excel oder CSV im Business-Plan inklusive.',
          bullets: [
            'Zeitstempel, IP, Gerätekennung pro Eintrag',
            'CSV / Excel-Export bis 10.000 Einträge',
            'Filter nach Zeitraum, Besuchertyp, Terminal',
          ],
        },
        {
          tab: 'Live-Anwesenheit',
          title: 'Wer ist gerade auf dem Gelände?',
          desc: 'Im Brand- oder Notfall zählt jede Sekunde. Die Live-Liste zeigt jede Person mit Besuchertyp, Ankunftszeit und Ansprechpartner.',
          bullets: [
            'Aktualisierung alle 30 Sekunden',
            'Filter nach Besuchertyp und Standort',
            'Als Notfallliste druckbar — PDF oder CSV',
          ],
        },
        {
          tab: 'Dashboard',
          title: 'Alle Check-ins in Echtzeit',
          desc: 'Das Admin-Dashboard zeigt jeden Eintrag mit Besuchertyp, Terminal-Zuordnung, Belehrungsstatus und Checkout — durchsuchbar, sortierbar, exportierbar.',
          bullets: [
            'Suche nach Name, Firma, Kennzeichen',
            'Filter und Sortierung pro Spalte',
            'Detailansicht mit Notiz und PDF-Download',
          ],
        },
      ],
    },
    legal: {
      badge: 'Rechtlich verpflichtet',
      title: 'Papier reicht nicht mehr — und Unwissenheit schützt nicht.',
      sub: 'Das Arbeitsschutzgesetz verpflichtet jeden Betrieb, Besucher und externe Fahrer zu unterweisen — dokumentiert, verständlich und in einer Sprache, die sie verstehen. Wer das nicht nachweisen kann, haftet.',
      items: [
        {
          title: '§ 12 ArbSchG · DGUV Vorschrift 1',
          text: 'Sicherheitsunterweisung ist für alle Personen auf dem Betriebsgelände Pflicht — auch für LKW-Fahrer, Monteure und externe Dienstleister. Gilt auch für ausländische Fahrer und Subunternehmer (§ 823 BGB). Keine Ausnahme.',
        },
        {
          title: 'Sprachpflicht: verständlich ist Pflicht',
          text: 'Eine Unterweisung auf Deutsch, die der polnische oder rumänische Fahrer nicht versteht, gilt rechtlich als nicht erfolgt — auch wenn er unterschrieben hat. Die Sprache des Empfängers entscheidet.',
        },
        {
          title: 'Haftung ohne Nachweis',
          text: 'BG-Regress bis 10 Mio. € (§ 110 SGB VII), Strafrecht § 229 StGB für verantwortliche Personen, mögliche Ablehnung der Betriebshaftpflicht wegen Obliegenheitsverletzung.',
        },
      ],
    },
    addonHardware: {
      badge: 'Hardware-Add-on',
      title: 'Sichtbarkeit und Sicherheit im Werk.',
      sub: 'Optionaler Etikettendrucker am Terminal. Bei jedem Check-in wird automatisch eine Besucherkarte mit Tagesnummer, Name und Ansprechpartner gedruckt — sichtbar getragen in der Ausweishülle.',
      stepsLabel: 'Ablauf',
      steps: [
        { title: 'Drucken', text: 'Beim Check-in druckt das Bundle automatisch eine Karte mit fortlaufender Tagesnummer und allen Besucherdaten.' },
        { title: 'Tragen', text: 'Besucher steckt die Karte in eine Ausweishülle und trägt sie sichtbar — Lanyard und Clip sind im Lieferumfang.' },
        { title: 'Checkout', text: 'Beim Verlassen tippt der Besucher die Nummer am Terminal. Vergessene Checkouts werden zum Tagesende automatisch geschlossen.' },
      ],
      reasonsTitle: 'Warum sich das Bundle lohnt',
      reasons: [
        { title: 'Sofort erkennbar', text: 'Mitarbeiter sehen auf einen Blick, wer ein registrierter Besucher ist und wer nicht zum Betrieb gehört.' },
        { title: 'Evakuierung sicher', text: 'Im Notfall stimmen Anwesenheitsliste und sichtbar getragene Karten überein — niemand wird vergessen.' },
        { title: 'Ohne Empfangspersonal', text: 'Karte wird automatisch erstellt — kein händisches Beschriften, keine Plastikkarten-Verwaltung.' },
      ],
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
      pricingNote: 'Hardware einmalig 299 € · Software-Add-on 19 €/Mon · Verbrauchsmaterial im Bundle.',
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
    featuresAll: {
      badge: 'Funktionsumfang',
      title: 'Alles, was Compliance, IT und Empfang erwarten',
      sub: 'Über die Kern-Bausteine hinaus deckt GateSign Anforderungen aus Compliance, IT und Tagesgeschäft ab.',
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
      ],
    },
    pricing: {
      badge: 'Preise',
      title: '79 € im Monat — oder ein BG-Vorfall.',
      sub: 'Reception und Logistik in jedem Plan enthalten. Jährliche Zahlung spart zwei Monate. Keine Einrichtungsgebühr.',
      cycleMonthly: 'Monatlich',
      cycleYearly: 'Jährlich · 2 Monate gratis',
      perMonth: '/Mon.',
      perYear: '/Jahr',
      yearlyHint: 'entspricht',
      vat: 'Alle Preise zzgl. MwSt. · Monatliche oder jährliche Abrechnung · Jederzeit zum Laufzeit-Ende kündbar',
      onRequest: 'Auf Anfrage',
      included: 'Enthalten',
      popular: 'Empfohlen',
      cta: 'Loslegen',
      contact: 'Kontakt aufnehmen',
      support: 'Inkl. E-Mail-Support und Einrichtungshilfe',
      tiers: [
        {
          key: 'solo',
          label: 'Solo',
          priceMonthly: '29',
          priceYearly: '290',
          sublabel: '1 Terminal · 1 Standort',
          desc: 'Für einen Standort mit einem Eingang.',
          features: [
            '1 Terminal, 1 Standort',
            'Check-in in 10 Sprachen',
            '28 ISO-Sicherheitsregeln',
            'Live-Anwesenheit',
            'Täglicher Compliance-Digest',
            'E-Mail-Support',
          ],
          highlight: false,
        },
        {
          key: 'business',
          label: 'Business',
          priceMonthly: '79',
          priceYearly: '790',
          sublabel: 'Bis 3 Terminals · 3 Standorte',
          desc: 'Mehrere Eingänge oder Standorte — ein Paketpreis.',
          features: [
            'Bis 3 Terminals, 3 Standorte',
            'Alles aus Solo',
            'Audit-Export (Excel, CSV) inklusive',
            'Team-Management mit Rollen',
            'Revisionssicheres Audit-Log',
            'Bevorzugter Support',
          ],
          highlight: true,
        },
        {
          key: 'enterprise',
          label: 'Enterprise',
          priceMonthly: null,
          priceYearly: null,
          sublabel: 'Unbegrenzt · alle Add-ons',
          desc: 'Für Konzerne und Betriebe mit vielen Standorten.',
          features: [
            'Unbegrenzte Terminals und Standorte',
            'Alle Add-ons inklusive',
            'Individuelle Einrichtung',
            'SLA und dedizierter Ansprechpartner',
            'API-Zugang',
            'Schulung und Beratung',
          ],
          highlight: false,
        },
      ],
    },
    addons: {
      badge: 'Add-ons',
      title: 'Modular dazubuchen — wenn Sie es brauchen.',
      sub: 'Jedes Add-on ist in Solo und Business buchbar. In Enterprise sind alle Add-ons enthalten. Aktivierung mit anteiliger Berechnung, jederzeit kündbar.',
      perMonth: '/Mon.',
      comingSoon: 'Demnächst',
      items: [
        {
          icon: 'printer',
          name: 'Besucherkarten-Drucker',
          price: '19',
          desc: 'Print-Server, Etiketten-Template und Wartung. Hardware einmalig 299 €.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'download',
          name: 'Audit-Export (Excel, CSV)',
          price: '19',
          desc: 'In Business bereits enthalten. Für Solo als Add-on buchbar.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'palette',
          name: 'Custom Branding',
          price: '19',
          desc: 'Eigenes Logo, eigene Farben am Terminal und im PDF.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'pin',
          name: 'Zusatz-Standort',
          price: '29',
          desc: 'Weiterer Standort über das Plan-Limit hinaus.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'sparkles',
          name: 'KI-Briefing-Übersetzung',
          price: '15',
          desc: 'Eigene Belehrungstexte werden automatisch in alle 10 Sprachen übersetzt.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'headphones',
          name: 'Prioritäts-Support',
          price: '29',
          desc: 'Schnellere Reaktionszeiten ohne festes SLA.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'calendar',
          name: 'Outlook-Integration',
          price: '29',
          desc: 'Microsoft-365-Anschluss: Vor-Registrierung über Kalender, Host-Benachrichtigung per Teams oder Mail.',
          status: 'coming_soon' as 'active' | 'coming_soon',
        },
      ],
    },
    faq: {
      title: 'Häufige Fragen',
      items: [
        {
          q: 'Was passiert, wenn die Berufsgenossenschaft einen Audit ankündigt?',
          a: 'Sie öffnen das Dashboard, wählen den Zeitraum und exportieren das Audit-Log als Excel- oder CSV-Datei. Jeder Eintrag enthält Besuchertyp, Belehrungssprache, Signatur mit Zeitstempel und Gerätekennung. Audit-Export ist im Business-Plan inklusive, für Solo als Add-on buchbar.',
        },
        {
          q: 'Reicht eine Belehrung auf Deutsch nicht aus?',
          a: 'Rechtlich nein. Eine Unterweisung, die der Empfänger nicht versteht, gilt als nicht erfolgt — auch wenn unterschrieben wurde. GateSign übersetzt die Belehrung automatisch in die Sprache des Besuchers (10 Sprachen verfügbar). Die Sprachpflicht ergibt sich aus § 12 ArbSchG in Verbindung mit § 81 BetrVG.',
        },
        {
          q: 'Ist die digitale Unterschrift rechtsgültig?',
          a: 'Ja. Jede Unterschrift wird mit Zeitstempel, Gerätekennung und IP-Adresse gespeichert und revisionssicher archiviert — gemäß den Anforderungen der DGUV Vorschrift 1 und § 12 ArbSchG.',
        },
        {
          q: 'Was ist mit Subunternehmern, die einen anderen Arbeitgeber haben?',
          a: 'Auch fremde Mitarbeiter auf Ihrem Gelände sind Ihre Verkehrssicherungspflicht (§ 823 BGB). GateSign belehrt jeden Besucher — unabhängig davon, wer der formelle Arbeitgeber ist. Das ist genau der Fall, in dem Excel-Listen rechtlich nicht ausreichen.',
        },
        {
          q: 'Wo werden die Daten gespeichert? Bekomme ich einen AVV nach DSGVO Art. 28?',
          a: 'Alle Daten liegen auf EU-Servern (Supabase Stockholm, Railway Amsterdam). Der Auftragsverarbeitungsvertrag ist als Click-Wrap-AVV in den Bedingungen enthalten. Auf Anfrage stellen wir Ihnen ein separates AVV-Dokument zur Unterschrift bereit.',
        },
        {
          q: 'Brauche ich spezielle Hardware?',
          a: 'Nein. GateSign läuft als PWA auf jedem modernen Tablet oder Touchscreen — kein App-Store, keine IT-Abteilung nötig. Ein handelsübliches Android- oder iPad-Tablet genügt. Optional bieten wir einen Besucherkarten-Drucker als Add-on.',
        },
        {
          q: 'Brauche ich beide Module — Logistik und Reception?',
          a: 'Nein. Sie können nur Logistik (LKW-Anmeldung) oder nur Reception (Besucherempfang) nutzen — oder beide kombinieren. Die Konfiguration erfolgt im Admin-Bereich pro Besuchertyp. In jedem Plan sind beide Module enthalten.',
        },
        {
          q: 'Funktioniert GateSign ohne Internet?',
          a: 'Für den Check-in ist eine kurze Internetverbindung erforderlich, da Einträge direkt gespeichert werden. Das Terminal zeigt einen Hinweis, wenn die Verbindung kurzzeitig wegfällt — der Eintrag wird sofort übertragen, sobald sie wieder steht.',
        },
        {
          q: 'Kann ich GateSign vorher in Aktion sehen?',
          a: 'Ja. Über „Demo anfragen" zeigen wir Ihnen das System mit Ihren Besuchertypen, Ihren Sicherheitsregeln und einem Beispiel-Audit-Export. Innerhalb von 24 Stunden melden wir uns mit einem Termin-Vorschlag.',
        },
      ],
    },
    finalCta: {
      title: 'Den Eingang dokumentieren — heute.',
      sub: 'Setup in unter 30 Minuten. Oder kurze Demo mit unseren Empfehlungen für Ihren Eingang.',
      primary: 'Loslegen',
      secondary: 'Demo anfragen',
      micro: 'Keine Einrichtungsgebühr · DSGVO-konform · Server in der EU',
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
      eyebrow: 'Compliance · Gate · Reception',
      title: 'Every visitor briefed. Every delivery on record. Every audit passed.',
      sub: 'GateSign is the self-service terminal for your gate and reception. Safety briefing in ten languages, digital signature, tamper-proof audit log. Meets § 12 ArbSchG and DGUV V1 — live in thirty minutes, no IT project.',
      cta: 'Get started',
      demo: 'Request a demo',
      microtrust: 'No setup fee · GDPR-compliant, EU servers · Setup in under 30 minutes',
    },
    trustedBy: {
      text: 'For production, logistics and engineering across DACH mid-market.',
      industries: ['Production', 'Logistics', 'Engineering', 'Construction', 'Wholesale'],
      dsgvo: ['GDPR-compliant', 'EU servers', 'DPA on request'],
    },
    pain: {
      badge: 'Why now',
      title: 'What if someone asks tomorrow?',
      sub: 'Three real-world scenarios from DACH mid-market — and what you would have on hand today if GateSign were running at your entrance.',
      items: [
        {
          trigger: 'The workers\' compensation board announces an audit.',
          status: 'Today: Excel list, clipboard, a few PDFs.',
          relief: 'With GateSign: full audit export at a click — every visitor, every briefing, every signature timestamped.',
        },
        {
          trigger: 'An external contractor gets injured on your site.',
          status: 'Today: nobody knows if they were briefed or which rules applied.',
          relief: 'With GateSign: proof on file — language, rules, signature, stored tamper-proof.',
        },
        {
          trigger: 'A GDPR complaint lands on your desk.',
          status: 'Today: paper visitor logs with full names lying open at reception.',
          relief: 'With GateSign: data stored in the EU, DPA click-wrap on record, access and deletion at a click.',
        },
      ],
    },
    modules: {
      badge: 'Two entrances',
      title: 'Built for gate and reception',
      sub: 'GateSign covers two clearly separated use cases — both running on the same platform, one subscription.',
      reception: {
        brand: 'Reception',
        title: 'Visitors and front desk',
        sub: 'For guests, customers, service staff and external contractors.',
        points: [
          'Reception without front-desk staff — self check-in on a tablet',
          'Assign host directly, automatic notification',
          'Optional visitor card with daily number via printer add-on',
          'Live presence list for fire safety and evacuation',
        ],
        cta: 'More on Reception',
        anchor: '#anwesenheit',
      },
      logistics: {
        brand: 'Logistics',
        title: 'Gate and goods receiving',
        sub: 'For truck drivers, hauliers and external deliveries.',
        points: [
          'Safety briefing in ten languages — also for foreign drivers',
          'Licence plate, trailer, reference and load number',
          'Documented per § 12 ArbSchG and DGUV V1',
          'No staff needed at the gate — self check-in at the terminal',
        ],
        cta: 'More on Logistics',
        anchor: '#sicherheitsbelehrung',
      },
    },
    how: {
      badge: 'Live in 30 minutes',
      title: 'How GateSign works',
      sub: 'Three setup steps. No app store, no IT project, no staff at the entrance.',
      steps: [
        { title: 'Configure', text: 'Set up safety rules, opening hours and briefing texts in the admin — templates for logistics and reception included.' },
        { title: 'Place the terminal', text: 'Mount a standard Android or iPad tablet at your entrance. GateSign runs as a PWA — no app store, no installation.' },
        { title: 'Let visitors check in', text: 'Visitors choose a language, confirm the rules, sign digitally. Entries appear in your dashboard in real time.' },
      ],
      terminalSteps: ['Choose language', 'Choose visitor type', 'Enter details', 'Confirm briefing', 'Sign'],
      terminalLabel: 'Terminal flow',
    },
    briefing: {
      badge: 'Safety Briefing',
      title: 'Briefing in the recipient\'s language — automatically.',
      sub: 'Every visitor sees the rules in their own language. You pick the rules once, GateSign translates them and stores every signature tamper-proof.',
      points: [
        { title: '28 ISO safety rules', text: 'Predefined rules: high-vis vest, forklift traffic, no-entry zones, video surveillance, engine off — ready to use. Add your own in two clicks.' },
        { title: 'PDF briefing per visitor type', text: 'Separate briefings for truck drivers, visitors and contractors — everyone gets exactly what applies to them.' },
        { title: 'Digital signature with timestamp', text: 'Legally sound confirmation at the terminal. Every signature stored with timestamp, device ID and IP.' },
        { title: 'Ten languages', text: 'German, English, Polish, Romanian, Ukrainian, Turkish, Czech, Hungarian, Bulgarian, Russian.' },
      ],
      rulesActive: 'Safety rules — active',
      rulesStatus: '6 rules active · automatically translated',
    },
    proof: {
      badge: 'Proof when audited',
      title: 'Three tools, one tamper-proof record',
      sub: 'What you hand over to the workers\' comp board, the data-protection officer or the insurer in an audit — at a click.',
      cards: [
        {
          tab: 'Audit log',
          title: 'Tamper-proof history',
          desc: 'Every check-in, every signature, every checkout — versioned, with timestamp and device ID. Excel and CSV export included in Business.',
          bullets: [
            'Timestamp, IP, device ID per entry',
            'CSV / Excel export up to 10,000 entries',
            'Filter by period, visitor type, terminal',
          ],
        },
        {
          tab: 'Live presence',
          title: 'Who is on site right now?',
          desc: 'In a fire or emergency, every second counts. The live list shows every person with visitor type, arrival time and host.',
          bullets: [
            'Refreshes every 30 seconds',
            'Filter by visitor type and site',
            'Printable as an emergency roster — PDF or CSV',
          ],
        },
        {
          tab: 'Dashboard',
          title: 'All check-ins in real time',
          desc: 'The admin dashboard shows every entry with visitor type, terminal, briefing status and checkout — searchable, sortable, exportable.',
          bullets: [
            'Search by name, company, plate',
            'Filter and sort per column',
            'Detail view with notes and PDF download',
          ],
        },
      ],
    },
    legal: {
      badge: 'Legally required',
      title: 'Paper is no longer enough — and ignorance is no defence.',
      sub: 'Occupational health law requires every business to brief visitors and external drivers — documented, comprehensible, and in a language they understand. Those who cannot prove it are liable.',
      items: [
        {
          title: '§ 12 ArbSchG · DGUV Regulation 1',
          text: 'Safety briefings are mandatory for all persons on company premises — including truck drivers, engineers and external contractors. Applies to foreign drivers and subcontractors too (§ 823 BGB). No exceptions.',
        },
        {
          title: 'Language obligation: comprehensible means native',
          text: 'A briefing in German that a Polish or Romanian driver cannot understand is legally treated as no briefing — even if they signed. The recipient\'s language is what counts.',
        },
        {
          title: 'Liability without proof',
          text: 'BG recourse up to €10 million (§ 110 SGB VII), criminal liability under § 229 StGB for responsible persons, possible rejection by employer\'s liability insurance.',
        },
      ],
    },
    addonHardware: {
      badge: 'Hardware add-on',
      title: 'Visibility and safety on site.',
      sub: 'Optional label printer at the terminal. On every check-in, a visitor card is printed automatically — with daily number, name and host. Worn visibly in a badge holder.',
      stepsLabel: 'How it works',
      steps: [
        { title: 'Print', text: 'At check-in the bundle prints a card automatically with a running daily number plus all visitor details.' },
        { title: 'Wear', text: 'The visitor slips the card into a badge holder and wears it visibly — lanyard and clip included.' },
        { title: 'Check out', text: 'On leaving the visitor enters their number at the terminal. Forgotten checkouts auto-close at end of day.' },
      ],
      reasonsTitle: 'Why the bundle pays off',
      reasons: [
        { title: 'Instantly recognisable', text: 'Staff see at a glance who is a registered visitor and who does not belong on the premises.' },
        { title: 'Evacuation-ready', text: 'In an emergency the live list and visibly worn cards match — no one gets missed.' },
        { title: 'No reception required', text: 'Card is created automatically — no manual labelling, no plastic-card management.' },
      ],
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
      pricingNote: 'Hardware €299 one-off · Software add-on €19/mo · Consumables in the bundle.',
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
    featuresAll: {
      badge: 'Feature set',
      title: 'Everything Compliance, IT and Reception expect',
      sub: 'Beyond the core building blocks, GateSign covers requirements from compliance, IT and day-to-day operations.',
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
      ],
    },
    pricing: {
      badge: 'Pricing',
      title: '€79 a month — or one BG incident.',
      sub: 'Reception and Logistics included in every plan. Annual billing saves two months. No setup fee.',
      cycleMonthly: 'Monthly',
      cycleYearly: 'Annual · 2 months free',
      perMonth: '/mo',
      perYear: '/yr',
      yearlyHint: 'equivalent to',
      vat: 'All prices excl. VAT · Monthly or annual billing · Cancel anytime at the end of the term',
      onRequest: 'On request',
      included: 'Included',
      popular: 'Recommended',
      cta: 'Get started',
      contact: 'Talk to sales',
      support: 'Incl. email support and setup assistance',
      tiers: [
        {
          key: 'solo',
          label: 'Solo',
          priceMonthly: '29',
          priceYearly: '290',
          sublabel: '1 terminal · 1 site',
          desc: 'For one site with a single entrance.',
          features: [
            '1 terminal, 1 site',
            'Check-in in 10 languages',
            '28 ISO safety rules',
            'Live presence',
            'Daily compliance digest',
            'Email support',
          ],
          highlight: false,
        },
        {
          key: 'business',
          label: 'Business',
          priceMonthly: '79',
          priceYearly: '790',
          sublabel: 'Up to 3 terminals · 3 sites',
          desc: 'Multiple entrances or sites — one package price.',
          features: [
            'Up to 3 terminals, 3 sites',
            'Everything in Solo',
            'Audit export (Excel, CSV) included',
            'Team management with roles',
            'Tamper-proof audit log',
            'Priority response',
          ],
          highlight: true,
        },
        {
          key: 'enterprise',
          label: 'Enterprise',
          priceMonthly: null,
          priceYearly: null,
          sublabel: 'Unlimited · all add-ons',
          desc: 'For groups and operations with many sites.',
          features: [
            'Unlimited terminals and sites',
            'All add-ons included',
            'Tailored onboarding',
            'SLA and dedicated contact',
            'API access',
            'Training and consulting',
          ],
          highlight: false,
        },
      ],
    },
    addons: {
      badge: 'Add-ons',
      title: 'Modular — add what you need.',
      sub: 'Every add-on is available in Solo and Business. Enterprise includes them all. Pro-rated activation, cancel anytime.',
      perMonth: '/mo',
      comingSoon: 'Coming soon',
      items: [
        {
          icon: 'printer',
          name: 'Visitor-card printer',
          price: '19',
          desc: 'Print server, label template and maintenance. Hardware €299 one-off.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'download',
          name: 'Audit export (Excel, CSV)',
          price: '19',
          desc: 'Already included in Business. Available as an add-on in Solo.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'palette',
          name: 'Custom branding',
          price: '19',
          desc: 'Your logo, your colours at the terminal and in the PDF.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'pin',
          name: 'Extra site',
          price: '29',
          desc: 'Additional site beyond the plan limit.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'sparkles',
          name: 'AI briefing translation',
          price: '15',
          desc: 'Your custom briefing texts translated into all 10 languages automatically.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'headphones',
          name: 'Priority support',
          price: '29',
          desc: 'Faster response times without a fixed SLA.',
          status: 'active' as 'active' | 'coming_soon',
        },
        {
          icon: 'calendar',
          name: 'Outlook integration',
          price: '29',
          desc: 'Microsoft 365: pre-registration via calendar, host notification via Teams or mail.',
          status: 'coming_soon' as 'active' | 'coming_soon',
        },
      ],
    },
    faq: {
      title: 'Frequently asked',
      items: [
        {
          q: 'What happens if the workers\' compensation board announces an audit?',
          a: 'You open the dashboard, choose the period and export the audit log as Excel or CSV. Every entry contains visitor type, briefing language, signature with timestamp and device ID. Audit export is included in Business, or available as an add-on in Solo.',
        },
        {
          q: 'Isn\'t a briefing in German enough?',
          a: 'Legally, no. A briefing the recipient does not understand is treated as no briefing — even if they signed. GateSign translates the briefing automatically into the visitor\'s language (10 languages available). The language obligation follows § 12 ArbSchG together with § 81 BetrVG.',
        },
        {
          q: 'Is the digital signature legally valid?',
          a: 'Yes. Every signature is stored with timestamp, device ID and IP address and archived tamper-proof — meeting the requirements of DGUV Regulation 1 and § 12 ArbSchG.',
        },
        {
          q: 'What about subcontractors employed by someone else?',
          a: 'External staff on your premises are still your responsibility (§ 823 BGB). GateSign briefs every visitor regardless of who the formal employer is. This is exactly where paper or Excel lists fall short legally.',
        },
        {
          q: 'Where is data stored? Can I get a DPA per GDPR Art. 28?',
          a: 'All data is stored on EU servers (Supabase Stockholm, Railway Amsterdam). The data-processing agreement is included as click-wrap in the terms. On request we provide a separate DPA document for signature.',
        },
        {
          q: 'Do I need special hardware?',
          a: 'No. GateSign runs as a PWA on any modern tablet or touchscreen — no app store, no IT department needed. A standard Android or iPad tablet is enough. Optionally we offer a visitor-card printer as an add-on.',
        },
        {
          q: 'Do I need both modules — Logistics and Reception?',
          a: 'No. You can use just Logistics (truck check-in) or just Reception (visitor reception) — or combine them. Configuration is per visitor type. Both modules are included in every plan.',
        },
        {
          q: 'Does GateSign work offline?',
          a: 'A short internet connection is required for check-in, as entries are stored immediately. The terminal shows a notice when the connection drops briefly — the entry is sent as soon as it returns.',
        },
        {
          q: 'Can I see GateSign in action before deciding?',
          a: 'Yes. Via "Request a demo" we walk you through the system with your visitor types, your safety rules and a sample audit export. We get back to you within 24 hours with a proposed time.',
        },
      ],
    },
    finalCta: {
      title: 'Document the entrance — today.',
      sub: 'Setup in under 30 minutes. Or a short demo with our recommendations for your entrance.',
      primary: 'Get started',
      secondary: 'Request a demo',
      micro: 'No setup fee · GDPR-compliant · EU servers',
    },
    footer: {
      rights: '© 2026 Alpha Consult GmbH · GateSign',
      impressum: 'Imprint',
      datenschutz: 'Privacy',
      avv: 'DPA',
      contact: 'info@gatesign.de',
      mailSubject: 'Enquiry',
    },
    demo: {
      title: 'Request a demo',
      sub: 'Tell us briefly what you\'d like to see — we\'ll get back within 24 hours.',
      name: 'Your name',
      company: 'Company',
      role: 'Role (e.g. plant manager, safety officer)',
      email: 'Business email',
      phone: 'Phone (optional)',
      employees: 'Sites with reception / gate',
      message: 'What would you like to see? (optional)',
      submit: 'Send request',
      cancel: 'Cancel',
      privacy: 'By submitting you agree to be contacted about the demo. No newsletter.',
      mailSubject: 'GateSign demo enquiry',
      employeeOptions: ['1 site', '2–5 sites', '6–20 sites', 'More than 20 sites'],
    },
  },
}

// ────────────────────────────────────────────────────────────────────
// Mockup-Komponenten
// ────────────────────────────────────────────────────────────────────

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
          <div className="bg-slate-900 px-5 py-3 flex items-center justify-between">
            <span className="text-white font-bold text-sm tracking-tight">GateSign</span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 text-xs font-medium">
                {lang === 'de' ? 'Aktiv' : 'Active'}
              </span>
            </div>
          </div>
          <div className="bg-slate-50 px-5 pt-4 pb-3">
            <div className="flex gap-1 mb-3">
              {[0, 1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  className={`h-1 flex-1 rounded-full ${i === 0 ? 'bg-indigo-600' : 'bg-slate-200'}`}
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
          <div className="px-3 pb-4 pt-2 grid grid-cols-2 gap-1.5">
            {languages.map((l, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-medium ${
                  i === 0
                    ? 'bg-indigo-600 border-indigo-600 text-white'
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
      <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-48 h-8 bg-slate-900/20 blur-xl rounded-full" />
    </div>
  )
}

type AddonCardData = (typeof content)['de']['addonHardware']['cardMock']

function PrinterCardMockup({ card }: { card: AddonCardData }) {
  return (
    <div className="relative">
      <div
        className="bg-white border border-slate-200 rounded-xl shadow-2xl w-80 sm:w-96"
        style={{ aspectRatio: '88 / 55' }}
      >
        <div className="h-full p-4 flex flex-col">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="h-9 w-36 bg-slate-100 rounded-md flex items-center justify-center">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate px-2">{card.company}</span>
            </div>
            <span className="text-[8px] text-slate-300 uppercase tracking-widest font-semibold">{card.label}</span>
          </div>
          <div className="flex-1 flex items-center gap-4 py-2 min-h-0">
            <div className="flex-shrink-0 flex flex-col items-center justify-center pr-4 border-r border-slate-100">
              <p className="text-[8px] text-slate-400 uppercase tracking-widest font-semibold mb-0.5">{card.numberLabel}</p>
              <p className="text-5xl font-black text-slate-900 tabular-nums leading-none">762</p>
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
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[9px] text-slate-400 uppercase tracking-wider">{card.dateLabel}</p>
            <p className="text-[10px] text-slate-600 tabular-nums">{card.dateValue}</p>
          </div>
        </div>
      </div>
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-56 h-6 bg-slate-900/15 blur-2xl rounded-full" />
    </div>
  )
}

// Dashboard-Mockup — wird im Beweis-Block (Tab "Dashboard") angezeigt
function DashboardMockup({ lang, badges }: { lang: 'de' | 'en'; badges: typeof typeBadge['de'] }) {
  const cols = lang === 'de'
    ? ['Ref.', 'Zeit', 'Typ', 'Fahrer', 'Kennzeichen', 'Spr.']
    : ['Ref.', 'Time', 'Type', 'Driver', 'Plate', 'Lang.']
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">{lang === 'de' ? 'Live · alle 30 s' : 'Live · every 30 s'}</span>
        </div>
        <span className="text-xs text-slate-400">{mockEntries.length} {lang === 'de' ? 'Einträge' : 'entries'}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-white">
            <tr className="text-left text-[10px] uppercase tracking-wider text-slate-400">
              {cols.map((c) => (
                <th key={c} className="px-3 py-2 font-semibold">{c}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mockEntries.slice(0, 5).map((e, i) => (
              <tr key={i} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-3 py-2.5 font-mono text-slate-600">{e.ref}</td>
                <td className="px-3 py-2.5 text-slate-600 tabular-nums">{e.time.split(',')[1]?.trim() ?? e.time}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${typeBadgeClass[e.type as keyof typeof typeBadgeClass]}`}>
                    {badges[e.type as keyof typeof badges]}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-slate-700 truncate max-w-[140px]">{e.name}</td>
                <td className="px-3 py-2.5 font-mono text-slate-600">{e.plate}</td>
                <td className="px-3 py-2.5">{e.flag}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Live-Anwesenheit Mockup
function PresenceMockup({ lang }: { lang: 'de' | 'en' }) {
  const persons = [
    { name: 'Tomasz Kowalski',  meta: lang === 'de' ? 'LKW · Nordwest Logistik · 08:14' : 'Truck · Nordwest Logistik · 08:14',  flag: '🇵🇱' },
    { name: 'Stefan Müller',    meta: lang === 'de' ? 'LKW · Hansa Transport · 07:53'   : 'Truck · Hansa Transport · 07:53',   flag: '🇩🇪' },
    { name: 'Gheorghe Ionescu', meta: lang === 'de' ? 'Besucher · Trans Ro · 07:31'     : 'Visitor · Trans Ro · 07:31',         flag: '🇷🇴' },
    { name: 'Mehmet Yilmaz',    meta: lang === 'de' ? 'LKW · Süd-Spedition · 09:02'     : 'Truck · Süd-Spedition · 09:02',     flag: '🇹🇷' },
  ]
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-700">
            {lang === 'de' ? 'Auf dem Gelände · jetzt' : 'On site · now'}
          </span>
        </div>
        <span className="text-xs text-slate-400">{persons.length} {lang === 'de' ? 'Personen' : 'persons'}</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {persons.map((p, i) => (
          <li key={i} className="px-4 py-3 flex items-center gap-3">
            <span className="text-lg leading-none">{p.flag}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 truncate">{p.name}</p>
              <p className="text-xs text-slate-500 truncate">{p.meta}</p>
            </div>
            <button className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors px-2 py-1 rounded">
              {lang === 'de' ? 'Auschecken' : 'Check out'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

// Audit-Export Mockup — exemplarisches PDF-Layout
function AuditMockup({ lang }: { lang: 'de' | 'en' }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-300" strokeWidth={1.75} />
          <span className="text-xs font-semibold">audit-export-2026-05.xlsx</span>
        </div>
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">{lang === 'de' ? 'Export' : 'Export'}</span>
      </div>
      <div className="p-5 space-y-3">
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{lang === 'de' ? 'Zeitraum' : 'Period'}</p>
            <p className="font-semibold text-slate-900">01.05 – 31.05.26</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{lang === 'de' ? 'Einträge' : 'Entries'}</p>
            <p className="font-semibold text-slate-900 tabular-nums">412</p>
          </div>
          <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{lang === 'de' ? 'Belehrungen' : 'Briefings'}</p>
            <p className="font-semibold text-slate-900 tabular-nums">412 / 412</p>
          </div>
        </div>
        <div className="border-t border-slate-100 pt-3">
          <div className="space-y-1.5">
            {[
              { id: '#0412', name: 'Kowalski, T.', lang: 'PL', time: '08:14', ok: true },
              { id: '#0411', name: 'Müller, S.',   lang: 'DE', time: '07:53', ok: true },
              { id: '#0410', name: 'Ionescu, G.',  lang: 'RO', time: '07:31', ok: true },
              { id: '#0409', name: 'Kovalenko, A.', lang: 'UK', time: '07:18', ok: true },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className="font-mono text-slate-400 tabular-nums w-12">{row.id}</span>
                <span className="font-medium text-slate-700 flex-1 truncate">{row.name}</span>
                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{row.lang}</span>
                <span className="font-mono text-slate-500 tabular-nums">{row.time}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
              </div>
            ))}
          </div>
        </div>
        <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
          <span className="text-[10px] text-slate-400">
            {lang === 'de' ? 'Inkl. Zeitstempel · IP · Gerätekennung' : 'Incl. timestamp · IP · device ID'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
            <CheckCircle2 className="w-3 h-3" strokeWidth={2.5} />
            {lang === 'de' ? 'Revisionssicher' : 'Tamper-proof'}
          </span>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────────
// Demo-Modal
// ────────────────────────────────────────────────────────────────────

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
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:border-indigo-600 focus:outline-none bg-white"
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
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:border-indigo-600 focus:outline-none resize-none"
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
                  className="text-sm font-semibold bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:border-indigo-600 focus:outline-none"
      />
    </div>
  )
}

// Map Add-on icon-key → Lucide icon component
function AddonIcon({ kind }: { kind: string }) {
  const cls = 'w-5 h-5 text-slate-700'
  switch (kind) {
    case 'printer':    return <Printer    className={cls} strokeWidth={1.75} />
    case 'download':   return <Download   className={cls} strokeWidth={1.75} />
    case 'palette':    return <Palette    className={cls} strokeWidth={1.75} />
    case 'pin':        return <MapPin     className={cls} strokeWidth={1.75} />
    case 'sparkles':   return <Sparkles   className={cls} strokeWidth={1.75} />
    case 'headphones': return <Headphones className={cls} strokeWidth={1.75} />
    case 'calendar':   return <Calendar   className={cls} strokeWidth={1.75} />
    default:           return <Check      className={cls} strokeWidth={1.75} />
  }
}

const painIcons = [
  <Gavel        key="g" className="w-5 h-5 text-indigo-700" strokeWidth={1.75} />,
  <AlertTriangle key="a" className="w-5 h-5 text-indigo-700" strokeWidth={1.75} />,
  <FileWarning  key="f" className="w-5 h-5 text-indigo-700" strokeWidth={1.75} />,
]

const legalIcons = [
  <Scale       key="scale"  className="w-5 h-5 text-white" strokeWidth={1.75} />,
  <Globe       key="globe"  className="w-5 h-5 text-white" strokeWidth={1.75} />,
  <ShieldAlert key="shield" className="w-5 h-5 text-white" strokeWidth={1.75} />,
]

const howIcons = [
  <Settings     key="settings" className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />,
  <Tablet       key="tablet"   className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />,
  <CheckCircle2 key="check"    className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />,
]

const featureIcons = [
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
]

// ────────────────────────────────────────────────────────────────────
// Landing Page
// ────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const [lang, setLang] = useState<'de' | 'en'>('de')
  const [faqOpen, setFaqOpen] = useState<number | null>(null)
  const [demoOpen, setDemoOpen] = useState(false)
  const [proofTab, setProofTab] = useState(0)
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')
  const t = content[lang]
  const badges = typeBadge[lang]

  const openDemo = () => setDemoOpen(true)

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── 1. Nav ──────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl font-bold tracking-tight">GateSign</Link>

          <div className="hidden md:flex items-center gap-7">
            <a href="#module" className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
              {lang === 'de' ? 'Module' : 'Modules'}
            </a>
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
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {t.nav.register}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 2. Hero ──────────────────────────────────────────── */}
      <section className="flex flex-col">
        <div className="flex-1 flex items-center">
          <div className="max-w-5xl mx-auto px-6 pt-16 pb-20 lg:pt-20 lg:pb-24 w-full">
            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-12 lg:gap-16">
              <div className="flex-1 text-center md:text-left">
                <p className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full mb-5 uppercase tracking-wide">
                  <ShieldCheck className="w-3.5 h-3.5" strokeWidth={2} />
                  {t.hero.eyebrow}
                </p>
                <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.1] mb-5 text-slate-900">
                  {t.hero.title}
                </h1>
                <p className="text-lg text-slate-500 mb-8 leading-relaxed md:max-w-xl mx-auto md:mx-0">
                  {t.hero.sub}
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-base font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                    {t.hero.cta}
                    <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
                  </Link>
                  <button
                    type="button"
                    onClick={openDemo}
                    className="inline-block text-slate-700 text-base font-semibold px-7 py-3.5 rounded-xl border border-slate-300 hover:border-slate-900 hover:text-slate-900 transition-colors"
                  >
                    {t.hero.demo}
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-5 leading-relaxed">
                  {t.hero.microtrust}
                </p>
              </div>
              <div className="flex-shrink-0 hidden md:block">
                <TerminalMockup lang={lang} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Trust-Bar ─────────────────────────────────────── */}
      <section className="border-y border-slate-100 py-8 bg-slate-50/40">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm text-slate-500 mb-4">{t.trustedBy.text}</p>
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {t.trustedBy.industries.map((ind, i) => (
              <span
                key={i}
                className="flex items-center gap-1.5 text-sm font-medium bg-white border border-slate-200 text-slate-700 px-4 py-1.5 rounded-full"
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

      {/* ── 4. Pain-Trigger (Darum jetzt) ──────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.pain.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.pain.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.pain.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.pain.items.map((item, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-5">
                  {painIcons[i]}
                </div>
                <p className="font-semibold text-slate-900 leading-snug mb-3">{item.trigger}</p>
                <div className="text-sm text-slate-500 leading-relaxed mb-4">
                  <span className="text-slate-400">{item.status}</span>
                </div>
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <p className="text-sm text-slate-700 leading-relaxed">{item.relief}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Module — Reception + Logistik ─────────────── */}
      <section id="module" className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-white text-slate-700 border border-slate-200 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.modules.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.modules.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.modules.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { icon: <Building2 className="w-6 h-6 text-indigo-600" strokeWidth={1.75} />, mod: t.modules.reception },
              { icon: <Truck     className="w-6 h-6 text-indigo-600" strokeWidth={1.75} />, mod: t.modules.logistics },
            ].map((m, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
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
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {m.mod.cta}
                  <ArrowRight className="w-3.5 h-3.5" strokeWidth={2.25} />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Wie es funktioniert ────────────────────────── */}
      <section className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              <Clock className="w-3.5 h-3.5" strokeWidth={2} />
              {t.how.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.how.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.how.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.how.steps.map((step, i) => (
              <div key={i} className="relative bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    {howIcons[i]}
                  </div>
                  <span className="text-xs font-bold text-slate-400 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Sicherheitsbelehrung Detail ─────────────────── */}
      <section id="sicherheitsbelehrung" className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.briefing.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight max-w-3xl mx-auto">{t.briefing.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.briefing.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {t.briefing.points.map((p, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="inline-flex w-7 h-7 rounded-md bg-indigo-50 border border-indigo-100 items-center justify-center text-xs font-bold text-indigo-700 tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-bold text-slate-900 leading-snug">{p.title}</h3>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed">{p.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. Beweis-Block (Audit · Anwesenheit · Dashboard) ── */}
      <section id="anwesenheit" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.proof.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.proof.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.proof.sub}</p>
          </div>

          {/* Tab-Switcher */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              {t.proof.cards.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setProofTab(i)}
                  className={`px-4 sm:px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    proofTab === i
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {c.tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab-Content — Mockup links, Beschreibung rechts */}
          <div id="dashboard" className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12 items-center">
            <div className="lg:col-span-3 order-2 lg:order-1">
              {proofTab === 0 && <AuditMockup lang={lang} />}
              {proofTab === 1 && <PresenceMockup lang={lang} />}
              {proofTab === 2 && <DashboardMockup lang={lang} badges={badges} />}
            </div>
            <div className="lg:col-span-2 order-1 lg:order-2">
              <h3 className="text-xl font-bold text-slate-900 mb-3 leading-snug">{t.proof.cards[proofTab].title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-5">{t.proof.cards[proofTab].desc}</p>
              <ul className="space-y-2.5">
                {t.proof.cards[proofTab].bullets.map((b, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2} />
                    <span className="text-sm text-slate-700 leading-snug">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 9. Compliance / Legal — DARK ───────────────────── */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-500/15 text-indigo-300 border border-indigo-400/20 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              <Gavel className="w-3.5 h-3.5" strokeWidth={2} />
              {t.legal.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 text-white leading-tight">{t.legal.title}</h2>
            <p className="text-slate-400 max-w-2xl mx-auto leading-relaxed">{t.legal.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {t.legal.items.map((item, i) => (
              <div key={i} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-6 backdrop-blur-sm">
                <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/30">
                  {legalIcons[i]}
                </div>
                <h3 className="font-bold text-white mb-2 leading-snug">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 10. Drucker-Add-on ──────────────────────────────── */}
      <section id="drucker" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              <Printer className="w-3.5 h-3.5" strokeWidth={2} />
              {t.addonHardware.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.addonHardware.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.addonHardware.sub}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-6">
                {t.addonHardware.stepsLabel}
              </p>
              <div className="space-y-6">
                {t.addonHardware.steps.map((step, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-9 h-9 rounded-full bg-indigo-600 text-white text-sm font-bold flex items-center justify-center flex-shrink-0">
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
              <PrinterCardMockup card={t.addonHardware.cardMock} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
            {[
              { icon: <Eye         className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />, item: t.addonHardware.reasons[0] },
              { icon: <ShieldCheck className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />, item: t.addonHardware.reasons[1] },
              { icon: <UserCheck   className="w-5 h-5 text-indigo-600" strokeWidth={1.75} />, item: t.addonHardware.reasons[2] },
            ].map((r, i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6">
                <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4">
                  {r.icon}
                </div>
                <h3 className="font-bold text-slate-900 mb-2 leading-snug">{r.item.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{r.item.text}</p>
              </div>
            ))}
          </div>

          {/* Zwei Bundle-Stufen */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
            {[
              { icon: <Wifi    className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, bundle: t.addonHardware.bundles[0] },
              { icon: <Network className="w-5 h-5 text-slate-700" strokeWidth={1.75} />, bundle: t.addonHardware.bundles[1] },
            ].map((b, i) => (
              <div key={i} className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0">
                    {b.icon}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 leading-tight">{b.bundle.name}</p>
                    <p className="text-xs text-slate-500">{b.bundle.tagline}</p>
                  </div>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">{b.bundle.desc}</p>
                <ul className="space-y-2 flex-1">
                  {b.bundle.features.map((f, fi) => (
                    <li key={fi} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-1" strokeWidth={2.5} />
                      <span className="text-sm text-slate-700 leading-snug">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-slate-500 mb-5">{t.addonHardware.pricingNote}</p>
            <button
              type="button"
              onClick={openDemo}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white text-base font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
            >
              {t.addonHardware.cta}
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 11. Feature-Grid ────────────────────────────────── */}
      <section id="funktionen" className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-white text-slate-700 border border-slate-200 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.featuresAll.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.featuresAll.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.featuresAll.sub}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {featureIcons.map((icon, i) => (
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

      {/* ── 12. Pricing v2 ──────────────────────────────────── */}
      <section id="pricing" className="bg-white py-20">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-10">
            <span className="inline-block text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.pricing.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.pricing.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.pricing.sub}</p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="flex justify-center mb-10">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setBilling('monthly')}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  billing === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.pricing.cycleMonthly}
              </button>
              <button
                onClick={() => setBilling('yearly')}
                className={`px-5 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  billing === 'yearly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {t.pricing.cycleYearly}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {t.pricing.tiers.map((tier) => {
              const price = billing === 'monthly' ? tier.priceMonthly : tier.priceYearly
              const period = billing === 'monthly' ? t.pricing.perMonth : t.pricing.perYear
              const yearlyEquiv = tier.priceYearly && tier.priceMonthly
                ? `${t.pricing.yearlyHint} ${(Number(tier.priceYearly) / 12).toFixed(2).replace('.', lang === 'de' ? ',' : '.')} ${t.pricing.perMonth}`
                : null
              return (
                <div
                  key={tier.key}
                  className={`relative rounded-2xl p-7 border flex flex-col text-left ${
                    tier.highlight
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xl md:-mt-2 md:mb-2 ring-1 ring-indigo-500/20'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  {tier.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs font-semibold bg-indigo-600 text-white px-3 py-1 rounded-full shadow-sm uppercase tracking-wide">
                      {t.pricing.popular}
                    </div>
                  )}
                  <p className={`text-xs font-semibold uppercase tracking-widest mb-1 ${
                    tier.highlight ? 'text-indigo-300' : 'text-slate-400'
                  }`}>
                    {tier.label}
                  </p>
                  <p className={`text-sm font-medium mb-4 ${tier.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                    {tier.sublabel}
                  </p>
                  {price ? (
                    <>
                      <div className="mb-1">
                        <span className={`text-4xl font-bold ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                          €{price}
                        </span>
                        <span className={`text-sm ml-1 ${tier.highlight ? 'text-slate-400' : 'text-slate-400'}`}>
                          {period}
                        </span>
                      </div>
                      {billing === 'yearly' && yearlyEquiv && (
                        <p className={`text-xs mb-3 ${tier.highlight ? 'text-slate-400' : 'text-slate-400'}`}>
                          {yearlyEquiv}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className={`text-2xl font-bold mb-3 ${tier.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {t.pricing.onRequest}
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed mb-5 ${tier.highlight ? 'text-slate-300' : 'text-slate-500'}`}>
                    {tier.desc}
                  </p>
                  <div className="mb-6 flex-1">
                    <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${tier.highlight ? 'text-indigo-300' : 'text-slate-400'}`}>
                      {t.pricing.included}
                    </p>
                    <div className="space-y-2">
                      {tier.features.map((feature, fi) => (
                        <div key={fi} className="flex items-start gap-2">
                          <Check
                            className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${tier.highlight ? 'text-emerald-400' : 'text-emerald-600'}`}
                            strokeWidth={2.5}
                          />
                          <span className={`text-sm leading-snug ${tier.highlight ? 'text-slate-300' : 'text-slate-600'}`}>
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className={`text-xs mb-4 ${tier.highlight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {t.pricing.support}
                  </p>
                  {price ? (
                    <Link
                      href="/register"
                      className={`block w-full font-semibold py-3 rounded-xl transition-colors text-sm text-center ${
                        tier.highlight
                          ? 'bg-white text-slate-900 hover:bg-slate-100'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {t.pricing.cta}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={openDemo}
                      className="block w-full font-semibold py-3 rounded-xl transition-colors text-sm text-center bg-indigo-600 text-white hover:bg-indigo-700"
                    >
                      {t.pricing.contact}
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          <p className="text-xs text-slate-400 mt-8 max-w-2xl mx-auto text-center leading-relaxed">
            {t.pricing.vat}
          </p>
        </div>
      </section>

      {/* ── 13. Add-on-Marketplace ────────────────────────── */}
      <section className="bg-slate-50 py-20 border-y border-slate-100">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-block text-xs font-semibold bg-white text-slate-700 border border-slate-200 px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              {t.addons.badge}
            </span>
            <h2 className="text-3xl font-bold mb-4 leading-tight">{t.addons.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto leading-relaxed">{t.addons.sub}</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {t.addons.items.map((item, i) => {
              const isComing = item.status === 'coming_soon'
              return (
                <div
                  key={i}
                  className={`relative bg-white border rounded-2xl p-5 flex flex-col ${
                    isComing ? 'border-dashed border-slate-300' : 'border-slate-200'
                  }`}
                >
                  {isComing && (
                    <span className="absolute -top-2.5 right-4 text-[10px] font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {t.addons.comingSoon}
                    </span>
                  )}
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
                      <AddonIcon kind={item.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 leading-snug">{item.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        <span className="font-mono">€{item.price}</span>{t.addons.perMonth}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 14. FAQ ─────────────────────────────────────────── */}
      <section id="faq" className="bg-white py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-10 leading-tight">{t.faq.title}</h2>
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

      {/* ── 15. Final CTA — zwei Pfade ─────────────────────── */}
      <section className="bg-slate-900 py-20">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">{t.finalCta.title}</h2>
          <p className="text-slate-400 mb-10 leading-relaxed text-lg">{t.finalCta.sub}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white text-base font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-900/30"
            >
              {t.finalCta.primary}
              <ArrowRight className="w-4 h-4" strokeWidth={2.25} />
            </Link>
            <button
              type="button"
              onClick={openDemo}
              className="inline-block text-white text-base font-semibold px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 hover:bg-white/5 transition-colors"
            >
              {t.finalCta.secondary}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-6 leading-relaxed">{t.finalCta.micro}</p>
        </div>
      </section>

      {/* ── 16. Footer ─────────────────────────────────────── */}
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
