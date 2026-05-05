// GateSign Check-in Terminal types

export interface CheckIn {
  id: string
  created_at: string
  driver_name: string
  company_name: string
  license_plate: string
  phone: string | null
  language: string
  briefing_accepted: boolean
  briefing_accepted_at: string | null
  briefing_version: string | null
  has_signature: boolean
  signature_data: string | null
  reference_number: string | null
}

export interface AppSettings {
  welcome_title: string
  welcome_subtitle: string
  signature_required: string
  site_info: string
  briefing_version: string
}

export interface SafetyBriefing {
  id: string
  language: string
  content: string
  version: string
  updated_at: string
}
