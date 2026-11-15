import { createClient } from '@supabase/supabase-js'

// Estas dos variables son públicas por diseño: la anon/publishable key solo da los permisos que
// definen las políticas RLS de supabase/schema.sql. Nunca pongas aquí la service_role key.
const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

export const supabase = createClient(url || 'http://localhost:54321', anonKey || 'missing-anon-key', {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
})
