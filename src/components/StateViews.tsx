import { motion } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

export function LoadingCards({ count = 3, height = 'h-64' }: { count?: number; height?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Cargando">
      {Array.from({ length: count }, (_, i) => (
        <motion.div
          key={i}
          className={`${height} rounded-3xl bg-white shadow-sm`}
          animate={{ opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
      <p className="text-3xl">😕</p>
      <p className="mt-2 font-semibold text-slate-800">{message}</p>
      <p className="text-sm text-slate-500">Revisa tu conexión e intenta de nuevo.</p>
      <button onClick={onRetry} className="mx-auto mt-4 flex items-center gap-2 rounded-2xl bg-green-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-800">
        <RefreshCw size={15} /> Reintentar
      </button>
    </div>
  )
}
