import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { HeartHandshake } from 'lucide-react'
import { WELLBEING_CHANNEL, wellbeingSurvey } from '../data/catalog'

export function WellbeingBanner() {
  const [surveyAnswer, answerSurvey] = useState<string | null>(null)
  const needsSupport = surveyAnswer === 'Difícil'

  return (
    <section className="mx-5 overflow-hidden rounded-3xl bg-gradient-to-br from-green-700 to-emerald-800 p-5 text-white shadow-md">
      <AnimatePresence mode="wait">
        {!surveyAnswer ? (
          <motion.div key="q" exit={{ opacity: 0, y: -8 }}>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-200">Encuesta de bienestar</p>
            <h3 className="mt-1 text-lg font-bold leading-snug">{wellbeingSurvey.question}</h3>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {wellbeingSurvey.options.map((o) => (
                <motion.button
                  key={o.label}
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ y: -2 }}
                  onClick={() => answerSurvey(o.label)}
                  className="flex flex-col items-center gap-1 rounded-2xl bg-white/15 py-3 text-xs font-medium backdrop-blur hover:bg-white/25"
                >
                  <span className="text-2xl">{o.emoji}</span>
                  {o.label}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            {needsSupport ? (
              <>
                <h3 className="text-lg font-bold">Gracias por contarnos 💚</h3>
                <p className="mt-1 text-sm leading-relaxed text-green-50">
                  Las semanas difíciles pasan, y no tienes que atravesarlas solo. Hablar con alguien ayuda más de lo que parece.
                </p>
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-white p-4 text-slate-800">
                  <HeartHandshake className="mt-0.5 shrink-0 text-green-700" size={22} />
                  <div>
                    <p className="text-sm font-semibold">{WELLBEING_CHANNEL.name}</p>
                    <p className="text-xs text-slate-500">{WELLBEING_CHANNEL.description}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-bold">¡Gracias por responder!</h3>
                <p className="mt-1 text-sm text-green-50">Tu respuesta es anónima y nos ayuda a planear mejores actividades de bienestar.</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
