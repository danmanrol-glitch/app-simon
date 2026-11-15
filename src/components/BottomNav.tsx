import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Bot, CalendarHeart, Home, User, Users } from 'lucide-react'
import { cn } from '../lib/utils'

const TABS = [
  { to: '/', label: 'Inicio', icon: Home },
  { to: '/actividades', label: 'Actividades', icon: CalendarHeart },
  { to: '/comunidad', label: 'Comunidad', icon: Users },
  { to: '/asistente', label: 'Asistente', icon: Bot },
  { to: '/perfil', label: 'Perfil', icon: User },
]

export function BottomNav() {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-40 px-4 pb-[max(env(safe-area-inset-bottom),12px)]">
      <ul className="flex items-center justify-around rounded-3xl border border-white/60 bg-white/70 px-1.5 py-2 shadow-lg shadow-slate-900/5 backdrop-blur-xl">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex-1">
            <NavLink to={to} end={to === '/'} className="relative flex flex-col items-center gap-0.5 rounded-2xl py-2">
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
                  <span className={cn('relative text-[10px] font-medium transition-colors', isActive ? 'text-green-700' : 'text-slate-400')}>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
