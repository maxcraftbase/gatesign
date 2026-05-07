// Centralized server-side Supabase config — import from here instead of repeating process.env
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
export const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
export const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const sbServiceHeaders = () => ({
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
})

export const sbAnonHeaders = (token?: string) => ({
  apikey: anonKey,
  Authorization: `Bearer ${token ?? anonKey}`,
})
