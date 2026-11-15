import { useState } from 'react'
import { motion } from 'framer-motion'
import { Bell, CalendarDays, HeartHandshake, Info, MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { Sheet } from './Sheet'
import { cn } from '../lib'

const ICONS = { actividad: CalendarDays, comunidad: MessageCircle, bienestar: HeartHandshake, sistema: Info }

export function NotificationBell() {
  const { notifications, markAllRead } = useApp()
  const [open, setOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(true)}
        aria-label={`Notificaciones (${unread} sin leer)`}
        className="relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-2 top-2 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </motion.button>
      <Sheet open={open} onClose={() => setOpen(false)} title="Notificaciones">
        <div className="space-y-2">
          {notifications.map((n) => {
            const Icon = ICONS[n.kind]
            return (
              <div key={n.id} className={cn('flex gap-3 rounded-2xl p-3', n.read ? 'bg-white' : 'bg-green-50')}>
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-green-700 shadow-sm">
                  <Icon size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-900">{n.title}</p>
                    <span className="shrink-0 text-[11px] text-slate-400">{n.time}</span>
                  </div>
                  <p className="text-sm text-slate-600">{n.body}</p>
                </div>
              </div>
            )
          })}
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="mt-4 w-full rounded-2xl bg-slate-100 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-200">
            Marcar todo como leído
          </button>
        )}
      </Sheet>
    </>
  )
}
