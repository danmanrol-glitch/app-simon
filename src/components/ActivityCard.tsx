import { motion } from 'framer-motion'
import { CalendarDays, Check, Clock, MapPin } from 'lucide-react'
import { ACTIVITY_CATEGORIES } from '../data/catalog'
import type { Activity, PublicProfile } from '../types'
import { AvatarStack, type Person } from './Avatar'
import { cn, formatShortDate, formatTime } from '../lib/utils'

interface Props {
  activity: Activity
  enrolled: boolean
  pending?: boolean
  onToggle: (id: string) => void
  profiles: Map<string, PublicProfile>
  compact?: boolean
}

export function ActivityCard({ activity, enrolled, pending = false, onToggle, profiles, compact = false }: Props) {
  const cat = ACTIVITY_CATEGORIES[activity.category]
  const taken = activity.attendee_ids.length
  const available = Math.max(activity.total_spots - taken, 0)
  const full = available <= 0 && !enrolled
  const pct = Math.min(100, Math.round((taken / activity.total_spots) * 100))
  const low = available > 0 && available <= 10
  const people: Person[] = activity.attendee_ids.slice(0, 4).map((id) => ({ id, name: profiles.get(id)?.full_name || profiles.get(id)?.nickname || '' }))
  const toggle = () => onToggle(activity.id)

  if (compact) {
    return (
      <motion.article whileHover={{ y: -3 }} className="w-60 shrink-0 snap-start overflow-hidden rounded-3xl bg-white shadow-sm">
        <div className={cn('flex h-24 items-end justify-between bg-gradient-to-br p-4', cat.gradient)}>
          <span className="text-3xl drop-shadow">{cat.emoji}</span>
          <span className="rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">{cat.label}</span>
        </div>
        <div className="p-4">
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-tight text-slate-900">{activity.name}</h3>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <CalendarDays size={13} /> {formatShortDate(activity.date)} · {formatTime(activity.start_time)}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <AvatarStack people={people} total={taken} max={3} />
            <EnrollButton enrolled={enrolled} full={full} pending={pending} onClick={toggle} small />
          </div>
        </div>
      </motion.article>
    )
  }

  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className={cn('relative flex h-28 items-end justify-between bg-gradient-to-br p-5', cat.gradient)}>
        <span className="text-4xl drop-shadow">{cat.emoji}</span>
        <span className="rounded-full bg-white/25 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{cat.label}</span>
      </div>
      <div className="space-y-4 p-5">
        <div>
          <h3 className="text-lg font-bold leading-tight text-slate-900">{activity.name}</h3>
          <p className="mt-1 text-xs text-slate-400">Organiza: {activity.organizer}</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{activity.description}</p>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li className="flex items-center gap-2"><CalendarDays size={16} className="text-green-700" />{formatShortDate(activity.date)}</li>
          <li className="flex items-center gap-2"><Clock size={16} className="text-green-700" />{formatTime(activity.start_time)} – {formatTime(activity.end_time)}</li>
          <li className="flex items-center gap-2"><MapPin size={16} className="text-green-700" />{activity.location}</li>
        </ul>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={cn('font-semibold', full ? 'text-rose-600' : low ? 'text-amber-600' : 'text-slate-600')}>
              {full ? 'Sin cupos' : `${available} cupos disponibles`}
            </span>
            <span className="text-slate-400">{taken}/{activity.total_spots}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className={cn('h-full rounded-full', full ? 'bg-rose-500' : low ? 'bg-amber-500' : 'bg-green-600')}
              initial={false}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AvatarStack people={people} total={taken} />
            <span className="text-xs text-slate-500">{taken} van</span>
          </div>
          <EnrollButton enrolled={enrolled} full={full} pending={pending} onClick={toggle} />
        </div>
      </div>
    </motion.article>
  )
}

function EnrollButton({ enrolled, full, pending, onClick, small }: { enrolled: boolean; full: boolean; pending: boolean; onClick: () => void; small?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={full ? undefined : { scale: 1.03 }}
      disabled={full || pending}
      onClick={onClick}
      aria-pressed={enrolled}
      className={cn(
        'flex items-center gap-1.5 rounded-2xl font-semibold transition-colors',
        pending && 'opacity-60',
        small ? 'min-h-[40px] px-3.5 py-2 text-xs' : 'min-h-[44px] px-5 py-3 text-sm',
        full && 'cursor-not-allowed bg-slate-100 text-slate-400',
        !full && enrolled && 'bg-green-50 text-green-700 ring-1 ring-green-200 hover:bg-green-100',
        !full && !enrolled && 'bg-green-700 text-white shadow-sm shadow-green-900/20 hover:bg-green-800',
      )}
    >
      {enrolled && <Check size={small ? 14 : 16} />}
      {full ? 'Agotado' : enrolled ? 'Inscrito' : small ? 'Unirme' : 'Inscribirme'}
    </motion.button>
  )
}
