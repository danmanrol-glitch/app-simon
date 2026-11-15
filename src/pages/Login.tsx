import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Eye, EyeOff, Lock, Mail, MailCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import { cn } from '../lib/utils'

type Mode = 'login' | 'registro'

export default function Login() {
  const { session, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [nickname, setNickname] = useState('')
  const [career, setCareer] = useState('')
  const [semester, setSemester] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkEmail, setCheckEmail] = useState(false)

  if (session) return <Navigate to="/" replace />

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await signIn(email.trim(), password)
      } else {
        const needsConfirmation = await signUp({ email: email.trim(), password, fullName: fullName.trim(), nickname: nickname.trim(), career: career.trim(), semester })
        if (needsConfirmation) setCheckEmail(true)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const input = 'w-full rounded-2xl bg-white px-4 py-3.5 text-[15px] shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-green-600/40'

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col bg-slate-50 px-6 pb-10 pt-14 shadow-2xl shadow-slate-900/10">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <img src="/ean-logo.png" alt="Universidad EAN" width={551} height={217} className="mx-auto h-auto w-44" />
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">EAN Connect</h1>
        <p className="mt-1 text-sm text-slate-500">Actividades, comunidad y bienestar para estudiantes EAN</p>
      </motion.div>

      {!isSupabaseConfigured && (
        <p className="mt-6 rounded-2xl bg-amber-50 p-3 text-sm text-amber-800 ring-1 ring-amber-200">
          Falta configurar Supabase: agrega <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code> (ver SUPABASE_SETUP.txt).
        </p>
      )}

      {checkEmail ? (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="mt-10 rounded-3xl bg-white p-6 text-center shadow-sm">
          <MailCheck className="mx-auto text-green-700" size={40} />
          <h2 className="mt-3 text-lg font-bold text-slate-900">Revisa tu correo</h2>
          <p className="mt-1 text-sm text-slate-600">Te enviamos un enlace a <strong>{email}</strong> para confirmar tu cuenta. Después vuelve aquí e inicia sesión.</p>
          <button onClick={() => { setCheckEmail(false); setMode('login') }} className="mt-5 w-full rounded-2xl bg-green-700 py-3 font-semibold text-white hover:bg-green-800">
            Ir a iniciar sesión
          </button>
        </motion.div>
      ) : (
        <>
          <div className="mt-8 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1">
            {(['login', 'registro'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setError(null) }} className={cn('relative rounded-xl py-2.5 text-sm font-semibold transition-colors', mode === m ? 'text-slate-900' : 'text-slate-500')}>
                {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
                <span className="relative">{m === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} className="mt-6 space-y-3">
            <AnimatePresence initial={false}>
              {mode === 'registro' && (
                <motion.div key="extra" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3 overflow-hidden">
                  <input className={input} placeholder="Nombre completo" autoComplete="name" required maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <div className="grid grid-cols-[1fr_auto] gap-3">
                    <input className={input} placeholder="Apodo (cómo te verán)" required maxLength={30} value={nickname} onChange={(e) => setNickname(e.target.value)} />
                    <select className={input} aria-label="Semestre" value={semester} onChange={(e) => setSemester(Number(e.target.value))}>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}.º sem</option>)}
                    </select>
                  </div>
                  <input className={input} placeholder="Carrera (ej. Negocios Internacionales)" required maxLength={80} value={career} onChange={(e) => setCareer(e.target.value)} />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input className={cn(input, 'pl-11')} type="email" placeholder="Correo electrónico" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                className={cn(input, 'pl-11 pr-12')}
                type={showPassword ? 'text' : 'password'}
                placeholder="Contraseña"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                minLength={mode === 'registro' ? 8 : undefined}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="button" onClick={() => setShowPassword((s) => !s)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 hover:text-slate-600">
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {mode === 'registro' && <p className="px-1 text-xs text-slate-400">Mínimo 8 caracteres.</p>}

            {error && <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">{error}</p>}

            <motion.button whileTap={{ scale: 0.98 }} disabled={loading || !isSupabaseConfigured} className="w-full rounded-2xl bg-green-700 py-4 font-semibold text-white shadow-sm shadow-green-900/20 hover:bg-green-800 disabled:opacity-60">
              {loading ? 'Un momento…' : mode === 'login' ? 'Entrar' : 'Crear mi cuenta'}
            </motion.button>
          </form>
        </>
      )}
    </div>
  )
}
