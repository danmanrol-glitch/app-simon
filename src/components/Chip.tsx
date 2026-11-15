import { motion } from 'framer-motion'
import { cn } from '../lib/utils'

export function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={cn(
        'min-h-[40px] shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors',
        active ? 'bg-green-700 text-white shadow-sm' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-100',
      )}
    >
      {children}
    </motion.button>
  )
}
