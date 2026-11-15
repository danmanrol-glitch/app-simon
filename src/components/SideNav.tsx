import { NavLink } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut } from 'lucide-react'
import { TABS } from './BottomNav'
import { Avatar } from './Avatar'
import { useAuth } from '../context/AuthContext'
import { cn } from '../lib/utils'

/** Navegación lateral para pantallas grandes (PC y tablets horizontales). */
export function SideNav() {
  const { session, profile, signOut } = useAuth()
  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-200/70 bg-white px-4 py-6 lg:flex xl:w-72">
      <div className="mb-8 px-2">
        <img src="/ean-logo.png" alt="Universidad EAN" className="h-auto w-28" />
        <p className="mt-3 text-lg font-bold tracking-tight text-slate-900">EAN Connect</p>
      </div>
      <nav className="flex-1">
        <ul className="space-y-1">
          {TABS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} end={to === '/'} className="relative flex min-h-[48px] items-center gap-3 rounded-2xl px-4 text-sm font-semibold">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span layoutId="side-pill" className="absolute inset-0 rounded-2xl bg-green-700/10" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                    )}
                    <Icon size={20} strokeWidth={isActive ? 2.4 : 1.9} className={cn('relative', isActive ? 'text-green-700' : 'text-slate-400')} />
                    <span className={cn('relative', isActive ? 'text-green-800' : 'text-slate-600')}>{label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      {session && (
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
          <Avatar person={{ id: session.user.id, name: profile?.full_name || profile?.nickname || '' }} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">{profile?.nickname || profile?.full_name || 'Estudiante'}</p>
            <p className="truncate text-xs text-slate-500">{profile?.career}</p>
          </div>
          <button onClick={() => void signOut()} aria-label="Cerrar sesión" className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 hover:bg-white hover:text-rose-600">
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  )
}
