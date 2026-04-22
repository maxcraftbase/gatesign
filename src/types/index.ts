export type Plan = 'starter' | 'professional' | 'business'

export interface Company {
  id: string
  name: string
  email: string
  plan: Plan
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  subscription_active: boolean
  created_at: string
}

export interface Site {
  id: string
  company_id: string
  name: string
  address: string | null
  qr_token: string
  created_at: string
}

export interface SafetyBriefing {
  id: string
  site_id: string
  version: number
  is_active: boolean
  created_at: string
  translations: BriefingTranslation[]
}

export interface BriefingTranslation {
  id: string
  briefing_id: string
  language: string
  content: string
}

export interface Driver {
  id: string
  name: string
  company_name: string
  phone: string
  license_plate: string
  trailer_plate: string | null
  preferred_language: string
  device_token: string
  created_at: string
}

export interface BriefingConfirmation {
  id: string
  driver_id: string
  site_id: string
  briefing_id: string
  briefing_version: number
  language: string
  confirmed_at: string
}

export interface CheckIn {
  id: string
  driver_id: string
  site_id: string
  briefing_id: string
  briefing_version: number
  timestamp: string
  driver_name: string
  driver_company: string
  driver_phone: string
  license_plate: string
  trailer_plate: string | null
  reference_number: string | null
  language: string
  briefing_confirmed: boolean
  briefing_confirmed_at: string | null
}

export const SUPPORTED_LANGUAGES = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'ro', label: 'Română' },
  { code: 'cs', label: 'Čeština' },
  { code: 'hu', label: 'Magyar' },
  { code: 'bg', label: 'Български' },
  { code: 'uk', label: 'Українська' },
  { code: 'ru', label: 'Русский' },
  { code: 'tr', label: 'Türkçe' },
] as const

export type LanguageCode = typeof SUPPORTED_LANGUAGES[number]['code']
