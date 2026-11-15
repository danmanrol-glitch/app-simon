import { Suspense } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { useKeyboardOpen } from '../hooks/useKeyboardOpen'

export function Layout() {
  const location = useLocation()
  const outlet = useOutlet()
  const keyboardOpen = useKeyboardOpen()
  return (
    <div data-keyboard={keyboardOpen ? 'open' : 'closed'} className="group mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-slate-50 shadow-2xl shadow-slate-900/10">
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={location.pathname === '/asistente' ? 'h-full overflow-hidden pt-[env(safe-area-inset-top)]' : 'no-scrollbar scroll-area h-full overflow-y-auto pb-28 pt-[env(safe-area-inset-top)] group-data-[keyboard=open]:pb-4'}
          >
            <Suspense fallback={<div className="grid h-full place-items-center py-24"><div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" /></div>}>
              {outlet}
            </Suspense>
          </motion.main>
        </AnimatePresence>
        <BottomNav />
      </div>
    </div>
  )
}
