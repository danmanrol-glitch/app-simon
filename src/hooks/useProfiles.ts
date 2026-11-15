import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { PublicProfile } from '../types'

// Caché en memoria de perfiles públicos para no pedir el mismo autor varias veces.
const cache = new Map<string, PublicProfile>()

export async function fetchPublicProfiles(ids: string[]) {
  const missing = [...new Set(ids)].filter((id) => !cache.has(id))
  if (missing.length) {
    const { data, error } = await supabase.from('public_profiles').select('*').in('id', missing)
    if (error) console.error('No se pudieron cargar perfiles:', error.message)
    ;(data as PublicProfile[] | null)?.forEach((p) => cache.set(p.id, p))
  }
  return cache
}

export function clearProfileCache(id?: string) {
  if (id) cache.delete(id)
  else cache.clear()
}

/** Devuelve un mapa id → perfil público para los ids dados. */
export function useProfiles(ids: string[]) {
  const key = [...new Set(ids)].sort().join(',')
  const [profiles, setProfiles] = useState<Map<string, PublicProfile>>(() => new Map(cache))

  useEffect(() => {
    if (!key) return
    let active = true
    fetchPublicProfiles(key.split(',')).then((c) => active && setProfiles(new Map(c)))
    return () => {
      active = false
    }
  }, [key])

  return profiles
}
