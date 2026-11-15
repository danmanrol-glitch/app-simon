import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Bot, HeartHandshake, RotateCcw, SendHorizontal, Sparkles } from 'lucide-react'
import { WELLBEING_CHANNEL } from '../mock/db'
import { cn } from '../lib'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  error?: boolean
}

const WELCOME: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Hola! Soy EAN Assistant 💚 Puedo ayudarte con la vida en la U, las sedes, procesos y a conocer gente. ¿En qué te ayudo hoy?',
}

const SUGGESTIONS = [
  '¿Cómo hago amigos en primer semestre?',
  '¿Dónde consulto el calendario de matrículas?',
  'Tips para organizar mi tiempo',
  'Me siento un poco solo en la U',
]

// Detección local (sin IA) para mostrar siempre el acceso a Bienestar, aunque el modelo falle.
const SUPPORT_PATTERN = /\b(sol[oa]s?|soledad|triste|tristeza|deprimid[oa]|excluid[oa]|ansios[oa]|ansiedad|no tengo amigos|nadie me habla)\b/i

export function EanAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSupport, setShowSupport] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, loading])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || loading) return
    if (SUPPORT_PATTERN.test(content)) setShowSupport(true)

    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content }
    const history = [...messages, userMsg]
    setMessages(history)
    setInput('')
    setLoading(true)

    const botId = crypto.randomUUID()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history.filter((m) => m.id !== 'welcome' && !m.error).map(({ role, content }) => ({ role, content })),
        }),
        signal: controller.signal,
      })

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'No pude conectarme con el asistente.')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let started = false
      for (;;) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        if (!chunk) continue
        if (!started) {
          started = true
          setLoading(false)
          setMessages((prev) => [...prev, { id: botId, role: 'assistant', content: chunk }])
        } else {
          setMessages((prev) => prev.map((m) => (m.id === botId ? { ...m, content: m.content + chunk } : m)))
        }
      }
      if (!started) throw new Error('El asistente no respondió. Intenta de nuevo.')
    } catch (err) {
      if (controller.signal.aborted) return
      setMessages((prev) => [
        ...prev,
        { id: botId, role: 'assistant', error: true, content: err instanceof Error ? err.message : 'Algo salió mal. Intenta de nuevo.' },
      ])
    } finally {
      setLoading(false)
      abortRef.current = null
    }
  }

  const reset = () => {
    abortRef.current?.abort()
    setMessages([WELCOME])
    setShowSupport(false)
    setLoading(false)
  }

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200/70 bg-white/80 px-5 py-4 backdrop-blur">
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-sm">
          <Bot size={22} />
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />
        </div>
        <div className="flex-1">
          <h1 className="font-bold text-slate-900">EAN Assistant</h1>
          <p className="flex items-center gap-1 text-xs text-slate-500"><Sparkles size={12} className="text-green-600" /> Asistente con IA · puede cometer errores</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={reset} aria-label="Nueva conversación" className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
          <RotateCcw size={18} />
        </motion.button>
      </header>

      <div className="no-scrollbar flex-1 space-y-3 overflow-y-auto px-4 py-5" aria-live="polite">
        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.2 }}
              className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[82%] whitespace-pre-wrap break-words px-4 py-3 text-[15px] leading-relaxed shadow-sm',
                  m.role === 'user' && 'rounded-3xl rounded-br-lg bg-white text-slate-800 ring-1 ring-slate-200',
                  m.role === 'assistant' && !m.error && 'rounded-3xl rounded-bl-lg bg-green-700 text-white',
                  m.error && 'rounded-3xl rounded-bl-lg bg-rose-50 text-rose-700 ring-1 ring-rose-200',
                )}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2" role="status">
            <div className="flex gap-1 rounded-3xl rounded-bl-lg bg-green-700 px-4 py-3.5 shadow-sm">
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="h-2 w-2 rounded-full bg-white/90"
                  animate={{ y: [0, -4, 0], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-500">EAN Assistant está escribiendo…</span>
          </motion.div>
        )}

        {messages.length === 1 && !loading && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <motion.button
                key={s}
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -2 }}
                onClick={() => send(s)}
                className="rounded-2xl bg-white px-3.5 py-2 text-left text-sm text-slate-700 shadow-sm ring-1 ring-slate-100 hover:ring-green-200"
              >
                {s}
              </motion.button>
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <AnimatePresence>
        {showSupport && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="mx-4 mb-2 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3 ring-1 ring-emerald-200">
            <HeartHandshake className="shrink-0 text-green-700" size={22} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">No estás solo 💚</p>
              <p className="text-xs text-slate-600">{WELLBEING_CHANNEL.name}: acompañamiento psicológico para estudiantes.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          send(input)
        }}
        className="flex items-end gap-2 px-4 pb-28 pt-2"
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              send(input)
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Escribe tu pregunta…"
          aria-label="Mensaje para EAN Assistant"
          className="max-h-32 min-h-[48px] flex-1 resize-none rounded-3xl bg-white px-5 py-3 text-[15px] shadow-sm outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-green-600/40"
        />
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          disabled={!input.trim() || loading}
          aria-label="Enviar mensaje"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-green-700 text-white shadow-md shadow-green-900/20 transition-colors hover:bg-green-800 disabled:bg-slate-300 disabled:shadow-none"
        >
          <SendHorizontal size={20} />
        </motion.button>
      </form>
    </div>
  )
}
