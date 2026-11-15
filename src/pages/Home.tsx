import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, Quote, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useActivities } from '../hooks/useActivities'
import { useProfiles } from '../hooks/useProfiles'
import { MOTIVATIONAL_QUOTES, TIP_CATEGORIES, tips, type Tip } from '../data/catalog'
import type { Activity } from '../types'
import { ActivityCard } from '../components/ActivityCard'
import { NotificationBell } from '../components/NotificationBell'
import { WellbeingBanner } from '../components/WellbeingBanner'
import { Avatar } from '../components/Avatar'
import { Sheet } from '../components/Sheet'
import { cn, todayISO } from '../lib/utils'

const greeting = () => {
  const h = new Date().getHours()
  return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

const dayOfYear = () => {
  const now = new Date()
  return Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
}

export default function Home() {
  const { session, profile } = useAuth()
  const { activities, enrolledIds, pending, loading, toggleEnroll } = useActivities()
  const [openTip, setOpenTip] = useState<Tip | null>(null)
  const quote = MOTIVATIONAL_QUOTES[dayOfYear() % MOTIVATIONAL_QUOTES.length]

  const recommended = useMemo(() => {
    const favorites = profile?.favorite_activities ?? []
    const interests = profile?.interests ?? []
    const score = (a: Activity) => (favorites.includes(a.category) ? 2 : 0) + a.tags.filter((t) => interests.includes(t)).length
    const upcoming = activities.filter((a) => a.date >= todayISO())
    const matched = upcoming.filter((a) => score(a) > 0).sort((a, b) => score(b) - score(a))
    // Si aún no hay intereses en el perfil, muestra las próximas actividades.
    return (matched.length ? matched : upcoming).slice(0, 8)
  }, [activities, profile])
  const profiles = useProfiles(recommended.flatMap((a) => a.attendee_ids.slice(0, 3)))
  const name = profile?.nickname || profile?.full_name || 'estudiante'

  return (
    <div className="space-y-7">
      <header className="flex items-center justify-between px-5 pt-6">
        <div className="flex items-center gap-3">
          <Avatar person={{ id: session?.user.id ?? 'me', name: profile?.full_name || name }} />
          <div>
            <p className="text-sm text-slate-500">{greeting()},</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{name} 👋</h1>
          </div>
        </div>
        <NotificationBell />
      </header>

      <motion.section initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} className="mx-5 rounded-3xl bg-white p-5 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-700">
          <Quote size={14} /> Frase del día
        </div>
        <p className="mt-2 text-[15px] font-medium leading-relaxed text-slate-800">{quote}</p>
      </motion.section>

      <Link to="/asistente" className="mx-5 flex items-center gap-4 rounded-3xl bg-gradient-to-br from-green-700 to-emerald-800 p-5 text-white shadow-md transition-transform hover:-translate-y-0.5">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15 backdrop-blur"><Bot size={24} /></div>
        <div className="flex-1">
          <p className="font-semibold">Pregúntale a EAN Assistant</p>
          <p className="text-sm text-green-100">Sedes, procesos, tips y más, con IA</p>
        </div>
        <ArrowRight size={20} />
      </Link>

      <section>
        <div className="mb-3 flex items-end justify-between px-5">
          <div>
            <h2 className="flex items-center gap-1.5 text-lg font-bold text-slate-900"><Sparkles size={18} className="text-green-700" /> Para ti</h2>
            <p className="text-xs text-slate-500">{profile?.interests.length ? 'Según tus intereses' : 'Próximas actividades · agrega intereses en tu perfil'}</p>
          </div>
          <Link to="/actividades" className="flex items-center gap-1 text-sm font-semibold text-green-700 hover:text-green-800">
            Ver todas <ArrowRight size={15} />
          </Link>
        </div>
        <div className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-2">
          {loading && [0, 1].map((i) => <div key={i} className="h-56 w-60 shrink-0 animate-pulse rounded-3xl bg-white shadow-sm" />)}
          {recommended.map((a) => (
            <ActivityCard
              key={a.id}
              activity={a}
              compact
              enrolled={enrolledIds.has(a.id)}
              pending={pending.has(a.id)}
              onToggle={toggleEnroll}
              profiles={profiles}
            />
          ))}
          {!loading && recommended.length === 0 && <p className="text-sm text-slate-500">No hay actividades próximas por ahora.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 px-5">
          <h2 className="text-lg font-bold text-slate-900">Sobrevive y disfruta la U</h2>
          <p className="text-xs text-slate-500">Consejos rápidos de 1 a 2 minutos</p>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5">
          {tips.map((t, i) => (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setOpenTip(t)}
              className="flex flex-col items-start rounded-3xl bg-white p-4 text-left shadow-sm"
            >
              <span className="text-2xl">{t.emoji}</span>
              <span className={cn('mt-2 rounded-full px-2 py-0.5 text-[10px] font-semibold', TIP_CATEGORIES[t.category].color)}>
                {TIP_CATEGORIES[t.category].label}
              </span>
              <span className="mt-2 text-sm font-semibold leading-snug text-slate-900">{t.title}</span>
            </motion.button>
          ))}
        </div>
      </section>

      <WellbeingBanner />

      <Link to="/comunidad" className="mx-5 flex items-center gap-4 rounded-3xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-green-100 text-green-700"><Users size={22} /></div>
        <div className="flex-1">
          <p className="font-semibold text-slate-900">¿Buscas con quién ir?</p>
          <p className="text-sm text-slate-500">Propón un plan o encuentra compañeros en Comunidad</p>
        </div>
        <ArrowRight className="text-slate-400" size={20} />
      </Link>

      <Sheet open={!!openTip} onClose={() => setOpenTip(null)} title={openTip?.title ?? ''}>
        {openTip && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{openTip.emoji}</span>
              <div>
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', TIP_CATEGORIES[openTip.category].color)}>
                  {TIP_CATEGORIES[openTip.category].label}
                </span>
                <p className="mt-1 text-xs text-slate-400">{openTip.readMinutes} min de lectura</p>
              </div>
            </div>
            <p className="text-[15px] leading-relaxed text-slate-700">{openTip.body}</p>
          </div>
        )}
      </Sheet>
    </div>
  )
}
