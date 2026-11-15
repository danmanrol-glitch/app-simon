import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import type { Profile } from '../types'

interface SignUpInput {
  email: string
  password: string
  fullName: string
  nickname: string
  career: string
  semester: number
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  /** Devuelve true si Supabase exige confirmar el correo antes de iniciar sesión. */
  signUp: (input: SignUpInput) => Promise<boolean>
  signOut: () => Promise<void>
  updateProfile: (patch: Partial<Omit<Profile, 'id'>>) => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function translateAuthError(message: string) {
  if (/invalid login credentials/i.test(message)) return 'Correo o contraseña incorrectos.'
  if (/email not confirmed/i.test(message)) return 'Confirma tu correo antes de iniciar sesión (revisa tu bandeja de entrada).'
  if (/already registered|already exists/i.test(message)) return 'Ya existe una cuenta con ese correo.'
  if (/password should be at least/i.test(message)) return 'La contraseña debe tener al menos 6 caracteres.'
  if (/rate limit/i.test(message)) return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
  if (/fetch/i.test(message)) return 'No hay conexión con el servidor. Revisa tu internet.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) console.error('No se pudo cargar el perfil:', error.message)
    setProfile((data as Profile | null) ?? null)
  }, [])

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) await loadProfile(data.session.user.id)
      if (active) setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      if (!next) setProfile(null)
      // Se difiere para no llamar a Supabase dentro del callback de auth (recomendación del SDK).
      else setTimeout(() => void loadProfile(next.user.id), 0)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [loadProfile])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error(translateAuthError(error.message))
  }

  const signUp = async ({ email, password, fullName, nickname, career, semester }: SignUpInput) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, nickname, career, semester },
        emailRedirectTo: window.location.origin,
      },
    })
    if (error) throw new Error(translateAuthError(error.message))
    return !data.session
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  const updateProfile = async (patch: Partial<Omit<Profile, 'id'>>) => {
    if (!session) throw new Error('Debes iniciar sesión.')
    const { data, error } = await supabase.from('profiles').update(patch).eq('id', session.user.id).select('*').single()
    if (error) throw new Error('No se pudo guardar tu perfil. Intenta de nuevo.')
    setProfile(data as Profile)
  }

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut, updateProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
