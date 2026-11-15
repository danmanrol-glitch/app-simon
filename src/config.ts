// Configuración pública de Supabase. Estos valores son públicos por diseño (llegan al navegador);
// la seguridad la dan las políticas RLS de supabase/schema.sql.
// Las variables de entorno VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY tienen prioridad si existen.
// NUNCA pongas aquí la secret key ni la service_role key.
export const PUBLIC_SUPABASE_URL = 'https://iikzjjamjbxbrqleebzc.supabase.co'
export const PUBLIC_SUPABASE_KEY = 'sb_publishable_lGGPMgGduL41eFIRB3Uucg_yvELNrA0'
