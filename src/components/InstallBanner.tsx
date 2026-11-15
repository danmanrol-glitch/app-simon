import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Download, Share, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'ean-install-dismissed'

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent)

/** Invita a instalar la app en la pantalla de inicio (Android: botón; iPhone: instrucciones). */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      /* almacenamiento bloqueado: se muestra igual */
    }
    if (dismissed || isStandalone()) return
    if (isIOS()) {
      setIos(true)
      setVisible(true)
      return
    }
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
      setVisible(true)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  const dismiss = () => {
    setVisible(false)
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      /* sin almacenamiento */
    }
  }

  const install = async () => {
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') dismiss()
    setDeferred(null)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="mx-5 flex items-center gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-green-100"
        >
          <img src="/icon-192.png" alt="" className="h-11 w-11 rounded-2xl" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">Instala EAN Connect</p>
            {ios ? (
              <p className="text-xs leading-snug text-slate-500">
                Toca <Share size={12} className="inline -translate-y-px" /> Compartir y luego “Agregar a inicio”.
              </p>
            ) : (
              <p className="text-xs text-slate-500">Ábrela como app, sin buscarla en el navegador.</p>
            )}
          </div>
          {!ios && (
            <button onClick={install} className="flex min-h-[44px] items-center gap-1.5 rounded-2xl bg-green-700 px-3.5 text-sm font-semibold text-white hover:bg-green-800">
              <Download size={16} /> Instalar
            </button>
          )}
          <button onClick={dismiss} aria-label="Cerrar aviso" className="-mr-2 grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
