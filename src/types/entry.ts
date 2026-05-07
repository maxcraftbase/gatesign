export interface Entry {
  id: string
  created_at: string
  driver_name: string
  company_name: string
  license_plate: string
  trailer_plate: string | null
  phone: string | null
  language: string
  briefing_accepted: boolean
  briefing_accepted_at: string | null
  has_signature: boolean
  reference_number: string | null
  visitor_type: string | null
  contact_person: string | null
  staff_note: string | null
  staff_note_translated: string | null
  assigned_contact: string | null
}

export const VISITOR_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  truck:   { label: 'LKW',       color: 'bg-amber-50 text-amber-700' },
  visitor: { label: 'Besucher',  color: 'bg-blue-50 text-blue-700' },
  service: { label: 'Dienst',    color: 'bg-violet-50 text-violet-700' },
}

export const LANG_FLAGS: Record<string, string> = {
  de: '🇩🇪', en: '🇬🇧', pl: '🇵🇱', ro: '🇷🇴', cs: '🇨🇿',
  hu: '🇭🇺', bg: '🇧🇬', uk: '🇺🇦', ru: '🇷🇺', tr: '🇹🇷',
}

export const LANG_NAMES: Record<string, string> = {
  de: 'Deutsch', en: 'Englisch', pl: 'Polnisch', ro: 'Rumänisch', cs: 'Tschechisch',
  hu: 'Ungarisch', bg: 'Bulgarisch', uk: 'Ukrainisch', ru: 'Russisch', tr: 'Türkisch',
}

export const VISITOR_TYPE_FULL: Record<string, string> = {
  truck: 'LKW-Fahrer', visitor: 'Besucher', service: 'Dienstleister',
}

export function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('de-DE', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso))
  } catch { return iso }
}
