import { Suspense } from 'react'
import { useLocation, useOutlet } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BottomNav } from './BottomNav'
import { SideNav } from './SideNav'
import { useKeyboardOpen } from '../hooks/useKeyboardOpen'
import { cn } from '../lib/utils'

const Spinner = () => (
  <div className="grid h-full place-items-center py-24">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-green-200 border-t-green-700" />
  </div>
)

export function Layout() {
  const location = useLocation()
  const outlet = useOutlet()
  const keyboardOpen = useKeyboardOpen()
  const isChat = location.pathname === '/asistente'

  return (
    <div data-keyboard={keyboardOpen ? 'open' : 'closed'} className="group flex h-[100dvh] w-full bg-slate-50">
      <SideNav />
      <div className="relative min-w-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className={cn(
              'h-full pt-[env(safe-area-inset-top)]',
              isChat ? 'overflow-hidden' : 'no-scrollbar scroll-area overflow-y-auto pb-28 group-data-[keyboard=open]:pb-4 lg:pb-10',
            )}
          >
            <div className={cn('mx-auto w-full', isChat ? 'h-full max-w-3xl lg:py-4' : 'max-w-md md:max-w-3xl lg:max-w-5xl lg:px-4')}>
              <Suspense fallback={<Spinner />}>{outlet}</Suspense>
            </div>
          </motion.main>
        </AnimatePresence>
        <BottomNav />
      </div>
    </div>
  )
}
