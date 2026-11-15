import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { Toast } from './Toast'

export function Layout() {
  const location = useLocation()
  const outlet = useOutlet()
  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-slate-50 shadow-2xl shadow-slate-900/10">
      <div className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="no-scrollbar h-full overflow-y-auto pb-32"
          >
            {outlet}
          </motion.main>
        </AnimatePresence>
        <BottomNav />
      </div>
      <Toast />
    </div>
  )
}
