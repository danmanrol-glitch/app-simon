import { motion } from 'framer-motion'
import { CalendarDays, Check, Clock, MapPin } from 'lucide-react'
import { ACTIVITY_CATEGORIES, type Activity } from '../mock/db'
import { useApp } from '../context/AppContext'
import { AvatarStack } from './Avatar'
import { cn, formatShortDate, formatTime } from '../lib'

export function ActivityCard({ activity, compact = false }: { activity: Activity; compact?: boolean }) {
  const { enrolledIds, toggleEnroll } = useApp()
  const cat = ACTIVITY_CATEGORIES[activity.category]
  const enrolled = enrolledIds.has(activity.id)
  const full = activity.availableSpots <= 0 && !enrolled
  const taken = activity.totalSpots - activity.availableSpots
  const pct = Math.round((taken / activity.totalSpots) * 100)
  const low = activity.availableSpots > 0 && activity.availableSpots <= 10

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
            <CalendarDays size={13} /> {formatShortDate(activity.date)} · {formatTime(activity.startTime)}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <AvatarStack userIds={activity.attendeeIds} max={3} />
            <EnrollButton enrolled={enrolled} full={full} onClick={() => toggleEnroll(activity.id)} small />
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
          <li className="flex items-center gap-2"><Clock size={16} className="text-green-700" />{formatTime(activity.startTime)} – {formatTime(activity.endTime)}</li>
          <li className="flex items-center gap-2"><MapPin size={16} className="text-green-700" />{activity.location}</li>
        </ul>
        <div>
          <div className="mb-1.5 flex items-center justify-between text-xs">
            <span className={cn('font-semibold', full ? 'text-rose-600' : low ? 'text-amber-600' : 'text-slate-600')}>
              {full ? 'Sin cupos' : `${activity.availableSpots} cupos disponibles`}
            </span>
            <span className="text-slate-400">{taken}/{activity.totalSpots}</span>
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
            <AvatarStack userIds={activity.attendeeIds} />
            <span className="text-xs text-slate-500">{activity.attendeeIds.length} van</span>
          </div>
          <EnrollButton enrolled={enrolled} full={full} onClick={() => toggleEnroll(activity.id)} />
        </div>
      </div>
    </motion.article>
  )
}

function EnrollButton({ enrolled, full, onClick, small }: { enrolled: boolean; full: boolean; onClick: () => void; small?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      whileHover={full ? undefined : { scale: 1.03 }}
      disabled={full}
      onClick={onClick}
      aria-pressed={enrolled}
      className={cn(
        'flex items-center gap-1.5 rounded-2xl font-semibold transition-colors',
        small ? 'px-3 py-2 text-xs' : 'px-5 py-3 text-sm',
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
