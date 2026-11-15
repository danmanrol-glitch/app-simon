import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CalendarCheck, EyeOff, Pencil, Shield, Trophy, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { ACTIVITY_CATEGORIES, INTEREST_OPTIONS, type PrivacySettings } from '../mock/db'
import { Avatar } from '../components/Avatar'
import { PageHeader } from '../components/PageHeader'
import { EventCalendar } from '../components/EventCalendar'
import { Sheet } from '../components/Sheet'
import { Toggle } from '../components/Toggle'
import { cn } from '../lib'

function Section({ title, icon, hidden, action, children }: { title: string; icon?: React.ReactNode; hidden?: boolean; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="mx-5 rounded-3xl bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-bold text-slate-900">{icon}{title}</h2>
        <div className="flex items-center gap-2">
          {hidden && <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-500"><EyeOff size={11} /> Oculto</span>}
          {action}
        </div>
      </div>
      {children}
    </section>
  )
}

export default function Profile() {
  const { user, activities, enrolledIds, updatePrivacy, updateNotifications, updateInterests } = useApp()
  const [editInterests, setEditInterests] = useState(false)
  const enrolled = activities.filter((a) => enrolledIds.has(a.id))
  const p = user.privacy

  const stats = [
    { label: 'Eventos asistidos', value: user.eventsAttended, icon: Trophy },
    { label: 'Inscripciones', value: enrolled.length, icon: CalendarCheck },
    { label: 'Grupos', value: user.groups.length, icon: Users },
  ]

  const privacyRows: { key: keyof Omit<PrivacySettings, 'profileVisibleTo'>; label: string }[] = [
    { key: 'showCareer', label: 'Mostrar mi carrera' },
    { key: 'showSemester', label: 'Mostrar mi semestre' },
    { key: 'showInterests', label: 'Mostrar mis intereses' },
    { key: 'showActivities', label: 'Mostrar actividades favoritas' },
    { key: 'showGroups', label: 'Mostrar mis grupos' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Mi perfil" />

      <section className="mx-5 flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-sm">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full bg-gradient-to-br from-green-400 to-emerald-700 p-1">
          <Avatar userId={user.id} size="lg" className="ring-4 ring-white" />
        </motion.div>
        <h2 className="mt-3 text-xl font-bold text-slate-900">{user.name}</h2>
        <p className="text-sm text-slate-500">@{user.nickname.toLowerCase()}</p>
        <p className="mt-1 text-sm font-medium text-green-700">
          {[p.showCareer && user.career, p.showSemester && `${user.semester}.º semestre`].filter(Boolean).join(' · ') || 'Carrera y semestre ocultos'}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">{user.bio}</p>
        <div className="mt-5 grid w-full grid-cols-3 gap-2">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-3">
              <Icon size={18} className="mx-auto text-green-700" />
              <p className="mt-1 text-xl font-bold text-slate-900">{value}</p>
              <p className="text-[11px] leading-tight text-slate-500">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <Section
        title="Intereses"
        hidden={!p.showInterests}
        action={<button onClick={() => setEditInterests(true)} aria-label="Editar intereses" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><Pencil size={15} /></button>}
      >
        <div className="flex flex-wrap gap-2">
          {user.interests.map((i) => <span key={i} className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">{i}</span>)}
        </div>
      </Section>

      <Section title="Actividades favoritas" hidden={!p.showActivities}>
        <div className="flex flex-wrap gap-2">
          {user.favoriteActivities.map((c) => (
            <span key={c} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{ACTIVITY_CATEGORIES[c].emoji} {ACTIVITY_CATEGORIES[c].label}</span>
          ))}
        </div>
      </Section>

      <Section title="Mis grupos" hidden={!p.showGroups}>
        <ul className="space-y-2">
          {user.groups.map((g) => (
            <li key={g} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-green-700 shadow-sm"><Users size={15} /></span>{g}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Mi calendario" icon={<CalendarCheck size={18} className="text-green-700" />}>
        <EventCalendar events={enrolled} />
      </Section>

      <Section title="Privacidad" icon={<Shield size={18} className="text-green-700" />}>
        <p className="mb-2 text-xs text-slate-500">Quién puede ver mi perfil</p>
        <div className="mb-2 grid grid-cols-3 gap-2 rounded-2xl bg-slate-100 p-1">
          {(['todos', 'compañeros', 'nadie'] as const).map((v) => (
            <button
              key={v}
              onClick={() => updatePrivacy({ profileVisibleTo: v })}
              className={cn('relative rounded-xl py-2 text-sm font-medium capitalize transition-colors', p.profileVisibleTo === v ? 'text-slate-900' : 'text-slate-500')}
            >
              {p.profileVisibleTo === v && <motion.span layoutId="vis" className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
              <span className="relative">{v}</span>
            </button>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {privacyRows.map((r) => (
            <Toggle key={r.key} label={r.label} checked={p[r.key]} onChange={(v) => updatePrivacy({ [r.key]: v })} />
          ))}
        </div>
      </Section>

      <Section title="Notificaciones" icon={<Bell size={18} className="text-green-700" />}>
        <div className="divide-y divide-slate-100">
          <Toggle label="Nuevas actividades" description="Según tus intereses" checked={user.notifications.newActivities} onChange={(v) => updateNotifications({ newActivities: v })} />
          <Toggle label="Respuestas en Comunidad" checked={user.notifications.communityReplies} onChange={(v) => updateNotifications({ communityReplies: v })} />
          <Toggle label="Recordatorios de eventos" description="Un día antes de cada actividad" checked={user.notifications.reminders} onChange={(v) => updateNotifications({ reminders: v })} />
          <Toggle label="Encuestas de bienestar" checked={user.notifications.wellbeingSurveys} onChange={(v) => updateNotifications({ wellbeingSurveys: v })} />
        </div>
      </Section>

      <Sheet open={editInterests} onClose={() => setEditInterests(false)} title="Tus intereses">
        <p className="mb-4 text-sm text-slate-500">Los usamos para recomendarte actividades en Inicio.</p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((i) => {
            const on = user.interests.includes(i)
            return (
              <motion.button
                key={i}
                whileTap={{ scale: 0.92 }}
                onClick={() => updateInterests(on ? user.interests.filter((x) => x !== i) : [...user.interests, i])}
                className={cn('rounded-full px-3.5 py-2 text-sm font-medium transition-colors', on ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {i}
              </motion.button>
            )
          })}
        </div>
      </Sheet>
    </div>
  )
}
