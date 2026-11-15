import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react'
import { ACTIVITY_CATEGORIES } from '../data/catalog'
import type { Activity } from '../types'
import { cn, formatTime, parseDate } from '../lib/utils'

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
const WEEK = ['L', 'M', 'M', 'J', 'V', 'S', 'D']
const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function EventCalendar({ events }: { events: Activity[] }) {
  const today = new Date()
  const initial = useMemo(() => {
    const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date))
    const upcoming = sorted.find((e) => parseDate(e.date) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
    const ref = upcoming ? parseDate(upcoming.date) : today
    return new Date(ref.getFullYear(), ref.getMonth(), 1)
  }, [])
  const [month, setMonth] = useState(initial)
  const [selected, setSelected] = useState<string | null>(null)

  const byDay = useMemo(() => {
    const m: Record<string, Activity[]> = {}
    events.forEach((e) => (m[e.date] ??= []).push(e))
    return m
  }, [events])

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const offset = (first.getDay() + 6) % 7
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))]
  }, [month])

  const monthEvents = events
    .filter((e) => { const d = parseDate(e.date); return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear() })
    .sort((a, b) => (a.date + a.start_time).localeCompare(b.date + b.start_time))
  const shown = selected ? byDay[selected] ?? [] : monthEvents

  const shift = (n: number) => { setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1)); setSelected(null) }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button onClick={() => shift(-1)} aria-label="Mes anterior" className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><ChevronLeft size={18} /></button>
        <p className="font-semibold text-slate-900">{MONTHS[month.getMonth()]} {month.getFullYear()}</p>
        <button onClick={() => shift(1)} aria-label="Mes siguiente" className="grid h-11 w-11 place-items-center rounded-xl text-slate-500 hover:bg-slate-100"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400">
        {WEEK.map((d, i) => <span key={i}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={i} />
          const k = key(d)
          const has = !!byDay[k]
          const isToday = k === key(today)
          const isSel = selected === k
          return (
            <motion.button
              key={k}
              whileTap={{ scale: 0.88 }}
              onClick={() => setSelected(isSel ? null : k)}
              className={cn(
                'relative flex aspect-square flex-col items-center justify-center rounded-xl text-sm transition-colors',
                isSel ? 'bg-green-700 font-semibold text-white' : has ? 'bg-green-50 font-semibold text-green-800 hover:bg-green-100' : 'text-slate-600 hover:bg-slate-50',
                isToday && !isSel && 'ring-1 ring-green-600',
              )}
            >
              {d.getDate()}
              {has && <span className={cn('absolute bottom-1 h-1 w-1 rounded-full', isSel ? 'bg-white' : 'bg-green-600')} />}
            </motion.button>
          )
        })}
      </div>
      <div className="mt-4 space-y-2">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((e) => (
            <motion.div layout key={e.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white text-xl shadow-sm">{ACTIVITY_CATEGORIES[e.category].emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-900">{e.name}</p>
                <p className="flex items-center gap-1 text-xs text-slate-500"><Clock size={12} /> {parseDate(e.date).getDate()} · {formatTime(e.start_time)}</p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-500"><MapPin size={12} /> {e.location}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {shown.length === 0 && <p className="py-3 text-center text-sm text-slate-400">{selected ? 'No tienes actividades este día.' : 'Sin actividades inscritas este mes.'}</p>}
      </div>
    </div>
  )
}
