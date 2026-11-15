import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, CalendarHeart, Home, User, Users } from 'lucide-react'
import { cn } from '../lib/utils'

export const TABS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/actividades', label: 'Actividades', icon: CalendarHeart },
  { to: '/comunidad', label: 'Comunidad', icon: Users },
  { to: '/asistente', label: 'Asistente', icon: Bot },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 mx-auto max-w-md px-3 lg:hidden pb-[max(env(safe-area-inset-bottom),10px)] transition-transform duration-200 group-data-[keyboard=open]:pointer-events-none group-data-[keyboard=open]:translate-y-full sm:px-4">
      <ul className="flex items-center justify-around rounded-3xl border border-white/60 bg-white/70 px-1 py-1.5 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} end={to === '/'} className="relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 rounded-2xl px-0.5 py-1.5">
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-2xl bg-green-700/10"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon size={22} strokeWidth={isActive ? 2.4 : 1.9} className={cn('relative transition-colors', isActive ? 'text-green-700' : 'text-slate-400')} />
                  <span className={cn('relative max-w-full truncate text-[10px] font-medium leading-tight tracking-tight transition-colors', isActive ? 'text-green-700' : 'text-slate-400')}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
