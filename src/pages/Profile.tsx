import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CalendarCheck, EyeOff, LogOut, Pencil, Shield, Sparkles, Trophy } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useActivities } from '../hooks/useActivities'
import { clearProfileCache } from '../hooks/useProfiles'
import { ACTIVITY_CATEGORIES, INTEREST_OPTIONS } from '../data/catalog'
import type { ActivityCategory, NotificationSettings, PrivacySettings, Profile as ProfileRow } from '../types'
import { Avatar } from '../components/Avatar'
import { PageHeader } from '../components/PageHeader'
import { EventCalendar } from '../components/EventCalendar'
import { Sheet } from '../components/Sheet'
import { Toggle } from '../components/Toggle'
import { LoadingCards } from '../components/StateViews'
import { cn, todayISO } from '../lib/utils'

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
  const { session, profile, updateProfile, signOut } = useAuth()
  const { showToast } = useToast()
  const { activities, enrolledIds } = useActivities()
  const [editing, setEditing] = useState(false)

  if (!profile || !session) {
    return (
      <div>
        <PageHeader title="Mi perfil" />
        <div className="px-5"><LoadingCards count={2} /></div>
      </div>
    )
  }

  const p = profile.privacy
  const enrolled = activities.filter((a) => enrolledIds.has(a.id))
  const today = todayISO()
  const stats = [
    { label: 'Eventos asistidos', value: enrolled.filter((a) => a.date < today).length, icon: Trophy },
    { label: 'Próximos', value: enrolled.filter((a) => a.date >= today).length, icon: CalendarCheck },
    { label: 'Intereses', value: profile.interests.length, icon: Sparkles },
  ]

  const save = async (patch: Partial<Omit<ProfileRow, 'id'>>) => {
    try {
      await updateProfile(patch)
      clearProfileCache(profile.id)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar.')
    }
  }
  const setPrivacy = (patch: Partial<PrivacySettings>) => save({ privacy: { ...p, ...patch } })
  const setNotifications = (patch: Partial<NotificationSettings>) => save({ notifications: { ...profile.notifications, ...patch } })

  const privacyRows: { key: keyof Omit<PrivacySettings, 'profileVisibleTo'>; label: string }[] = [
    { key: 'showCareer', label: 'Mostrar mi carrera' },
    { key: 'showSemester', label: 'Mostrar mi semestre' },
    { key: 'showInterests', label: 'Mostrar mis intereses' },
    { key: 'showActivities', label: 'Mostrar actividades favoritas' },
  ]

  return (
    <div className="space-y-5">
      <PageHeader title="Mi perfil" />

      <section className="relative mx-5 flex flex-col items-center rounded-3xl bg-white p-6 text-center shadow-sm">
        <button onClick={() => setEditing(true)} className="absolute right-3 top-3 flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-slate-100 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-200">
          <Pencil size={13} /> Editar
        </button>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="rounded-full bg-gradient-to-br from-green-400 to-emerald-700 p-1">
          <Avatar person={{ id: profile.id, name: profile.full_name || profile.nickname }} size="lg" className="ring-4 ring-white" />
        </motion.div>
        <h2 className="mt-3 text-xl font-bold text-slate-900">{profile.full_name || profile.nickname}</h2>
        <p className="text-sm text-slate-500">@{profile.nickname.toLowerCase()} · {session.user.email}</p>
        <p className="mt-1 text-sm font-medium text-green-700">
          {[profile.career, `${profile.semester}.º semestre`].filter(Boolean).join(' · ')}
        </p>
        {profile.bio && <p className="mt-3 text-sm leading-relaxed text-slate-600">{profile.bio}</p>}
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

      <Section title="Intereses" hidden={!p.showInterests}>
        {profile.interests.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((i) => <span key={i} className="rounded-full bg-green-50 px-3 py-1.5 text-sm font-medium text-green-800">{i}</span>)}
          </div>
        ) : (
          <button onClick={() => setEditing(true)} className="text-sm font-medium text-green-700">+ Agrega tus intereses para recibir recomendaciones</button>
        )}
      </Section>

      <Section title="Actividades favoritas" hidden={!p.showActivities}>
        {profile.favorite_activities.length ? (
          <div className="flex flex-wrap gap-2">
            {profile.favorite_activities.map((c) => (
              <span key={c} className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700">{ACTIVITY_CATEGORIES[c].emoji} {ACTIVITY_CATEGORIES[c].label}</span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Aún no eliges categorías favoritas.</p>
        )}
      </Section>

      <Section title="Mi calendario" icon={<CalendarCheck size={18} className="text-green-700" />}>
        <EventCalendar events={enrolled} />
      </Section>

      <Section title="Privacidad" icon={<Shield size={18} className="text-green-700" />}>
        <p className="mb-2 text-xs text-slate-500">Quién puede ver mis datos en la Comunidad</p>
        <div className="mb-2 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          {(['todos', 'nadie'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setPrivacy({ profileVisibleTo: v })}
              className={cn('relative rounded-xl py-2 text-sm font-medium transition-colors', p.profileVisibleTo === v ? 'text-slate-900' : 'text-slate-500')}
            >
              {p.profileVisibleTo === v && <motion.span layoutId="vis" className="absolute inset-0 rounded-xl bg-white shadow-sm" />}
              <span className="relative">{v === 'todos' ? 'Estudiantes EAN' : 'Solo mi nombre'}</span>
            </button>
          ))}
        </div>
        <div className="divide-y divide-slate-100">
          {privacyRows.map((r) => (
            <Toggle key={r.key} label={r.label} checked={p[r.key]} onChange={(v) => setPrivacy({ [r.key]: v })} />
          ))}
        </div>
      </Section>

      <Section title="Notificaciones" icon={<Bell size={18} className="text-green-700" />}>
        <div className="divide-y divide-slate-100">
          <Toggle label="Nuevas actividades" description="Según tus intereses" checked={profile.notifications.newActivities} onChange={(v) => setNotifications({ newActivities: v })} />
          <Toggle label="Respuestas en Comunidad" checked={profile.notifications.communityReplies} onChange={(v) => setNotifications({ communityReplies: v })} />
          <Toggle label="Recordatorios de eventos" description="Un día antes de cada actividad" checked={profile.notifications.reminders} onChange={(v) => setNotifications({ reminders: v })} />
          <Toggle label="Encuestas de bienestar" checked={profile.notifications.wellbeingSurveys} onChange={(v) => setNotifications({ wellbeingSurveys: v })} />
        </div>
      </Section>

      <button onClick={() => void signOut()} className="mx-5 flex w-[calc(100%-2.5rem)] items-center justify-center gap-2 rounded-3xl bg-white py-4 text-sm font-semibold text-rose-600 shadow-sm hover:bg-rose-50">
        <LogOut size={17} /> Cerrar sesión
      </button>

      <EditProfileSheet open={editing} onClose={() => setEditing(false)} profile={profile} onSave={updateProfile} />
    </div>
  )
}

function EditProfileSheet({ open, onClose, profile, onSave }: { open: boolean; onClose: () => void; profile: ProfileRow; onSave: (patch: Partial<Omit<ProfileRow, 'id'>>) => Promise<void> }) {
  const { showToast } = useToast()
  const [form, setForm] = useState(profile)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) setForm(profile)
  }, [open, profile])

  const toggleIn = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((x) => x !== value) : [...list, value])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nickname.trim()) return showToast('El apodo no puede estar vacío.')
    setSaving(true)
    try {
      await onSave({
        full_name: form.full_name.trim(),
        nickname: form.nickname.trim(),
        career: form.career.trim(),
        semester: form.semester,
        bio: form.bio.trim(),
        interests: form.interests,
        favorite_activities: form.favorite_activities,
      })
      clearProfileCache(profile.id)
      showToast('Perfil actualizado')
      onClose()
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'No se pudo guardar.')
    } finally {
      setSaving(false)
    }
  }

  const input = 'w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none ring-green-600/30 focus:ring-2'
  const label = 'mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-400'

  return (
    <Sheet open={open} onClose={onClose} title="Editar perfil">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className={label} htmlFor="full_name">Nombre</label>
          <input id="full_name" className={input} maxLength={80} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={label} htmlFor="nickname">Apodo</label>
            <input id="nickname" className={input} maxLength={30} required value={form.nickname} onChange={(e) => setForm({ ...form, nickname: e.target.value })} />
          </div>
          <div>
            <label className={label} htmlFor="semester">Semestre</label>
            <select id="semester" className={input} value={form.semester} onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}.º</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={label} htmlFor="career">Carrera</label>
          <input id="career" className={input} maxLength={80} placeholder="Ej: Negocios Internacionales" value={form.career} onChange={(e) => setForm({ ...form, career: e.target.value })} />
        </div>
        <div>
          <label className={label} htmlFor="bio">Sobre mí</label>
          <textarea id="bio" className={cn(input, 'resize-none')} rows={3} maxLength={300} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </div>
        <div>
          <p className={label}>Intereses</p>
          <div className="flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map((i) => (
              <button type="button" key={i} onClick={() => setForm({ ...form, interests: toggleIn(form.interests, i) })}
                className={cn('rounded-full px-3.5 py-2 text-sm font-medium transition-colors', form.interests.includes(i) ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {i}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className={label}>Actividades favoritas</p>
          <div className="flex flex-wrap gap-2">
            {(Object.keys(ACTIVITY_CATEGORIES) as ActivityCategory[]).map((c) => (
              <button type="button" key={c} onClick={() => setForm({ ...form, favorite_activities: toggleIn(form.favorite_activities, c) })}
                className={cn('rounded-full px-3.5 py-2 text-sm font-medium transition-colors', form.favorite_activities.includes(c) ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>
                {ACTIVITY_CATEGORIES[c].emoji} {ACTIVITY_CATEGORIES[c].label}
              </button>
            ))}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} disabled={saving} className="w-full rounded-2xl bg-green-700 py-3.5 font-semibold text-white shadow-sm hover:bg-green-800 disabled:opacity-60">
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </motion.button>
      </form>
    </Sheet>
  )
}
