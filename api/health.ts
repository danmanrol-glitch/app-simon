// Diagnóstico de configuración: dice qué variables existen y si la key de Gemini funciona.
// No devuelve ningún valor secreto. countTokens es gratis en la API de Gemini.
import { ApiError as GeminiApiError, GoogleGenAI } from '@google/genai'

export const config = { maxDuration: 30 }

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })

/** Describe la forma de la key sin revelarla (prefijo de 4 caracteres y largo). */
function keyShape(key: string | undefined) {
  if (!key) return 'falta'
  const trimmed = key.trim()
  const notes = [
    `empieza por "${trimmed.slice(0, 4)}…"`,
    `${trimmed.length} caracteres`,
    trimmed !== key ? 'TIENE ESPACIOS O SALTOS DE LÍNEA AL INICIO/FINAL' : null,
    /^["']|["']$/.test(trimmed) ? 'TIENE COMILLAS' : null,
  ].filter(Boolean)
  return notes.join(', ')
}

async function checkGemini(model: string) {
  const key = process.env.GEMINI_API_KEY
  if (!key) return { ok: false, code: 'SIN_KEY' }
  try {
    const ai = new GoogleGenAI({ apiKey: key.trim() })
    await ai.models.countTokens({ model, contents: 'hola' })
    // Generación mínima (pocas decenas de tokens): algunas keys pasan countTokens pero no pueden generar.
    const stream = await ai.models.generateContentStream({ model, contents: 'Responde solo: ok', config: { maxOutputTokens: 20 } })
    let text = ''
    for await (const chunk of stream) text += chunk.text ?? ''
    return { ok: true, code: 'OK', respuesta: text.trim().slice(0, 20) }
  } catch (err) {
    if (err instanceof GeminiApiError) {
      let reason = ''
      try {
        reason = JSON.parse(err.message)?.error?.details?.find((d: { reason?: string }) => d.reason)?.reason ?? ''
      } catch {
        reason = /api key not valid/i.test(err.message) ? 'API_KEY_INVALID' : ''
      }
      return { ok: false, code: `HTTP_${err.status}`, reason: reason || err.message.slice(0, 120) }
    }
    return { ok: false, code: 'ERROR_DE_RED', reason: err instanceof Error ? err.message.slice(0, 120) : String(err) }
  }
}

export async function GET(): Promise<Response> {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.8-flash'
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.6-flash,gemini-3.5-flash-lite,gemini-flash-lite-latest').split(',').map((m) => m.trim()).filter(Boolean)
  const models = [...new Set([primary, ...fallbacks])]
  const results = await Promise.all(models.map((m) => checkGemini(m)))
  return json({
    entorno: process.env.VERCEL_ENV ?? 'local',
    deploy: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? null,
    variables: {
      GEMINI_API_KEY: keyShape(process.env.GEMINI_API_KEY),
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ? 'configurada' : 'falta',
      AI_PROVIDER: process.env.AI_PROVIDER || '(vacío → gemini)',
      GEMINI_MODEL: primary,
    },
    gemini: Object.fromEntries(models.map((m, i) => [m, results[i]])),
  })
}
