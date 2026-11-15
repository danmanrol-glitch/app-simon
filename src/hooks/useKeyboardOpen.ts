import { useEffect, useState } from 'react'

/**
 * Detecta si el teclado del teléfono está abierto (el área visible se encoge mucho).
 * Se usa para ocultar la barra inferior y dejar más espacio al campo de texto.
 */
export function useKeyboardOpen() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const baseline = { h: window.innerHeight }
    const update = () => {
      // Si el navegador redimensiona el layout (Android con resizes-content), innerHeight también baja:
      // comparamos contra la altura más grande vista, que corresponde al teclado cerrado.
      baseline.h = Math.max(baseline.h, window.innerHeight, vv.height)
      const focused = document.activeElement
      const typing = focused instanceof HTMLInputElement || focused instanceof HTMLTextAreaElement
      setOpen(typing && baseline.h - vv.height > 150)
    }
    const onOrientation = () => {
      baseline.h = window.innerHeight
      update()
    }
    vv.addEventListener('resize', update)
    window.addEventListener('focusin', update)
    window.addEventListener('focusout', () => setTimeout(update, 50))
    window.addEventListener('orientationchange', onOrientation)
    return () => {
      vv.removeEventListener('resize', update)
      window.removeEventListener('focusin', update)
      window.removeEventListener('orientationchange', onOrientation)
    }
  }, [])
  return open
}
