// Vercel Function (Node.js runtime, Web handler) que conecta EAN Assistant con un modelo de IA.
// Proveedor por defecto: Gemini (GEMINI_API_KEY). Alternativa: Claude (ANTHROPIC_API_KEY).
// Las API keys se leen solo del entorno del servidor y nunca llegan al navegador.
import Anthropic from '@anthropic-ai/sdk'
import { ApiError as GeminiApiError, GoogleGenAI, ThinkingLevel } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

// Valores públicos de Supabase (los mismos de src/config.ts). Se repiten aquí porque las
// funciones de Vercel corren como ESM y un import relativo sin extensión rompe la función.
const PUBLIC_SUPABASE_URL = 'https://iikzjjamjbxbrqleebzc.supabase.co'
const PUBLIC_SUPABASE_KEY = 'sb_publishable_lGGPMgGduL41eFIRB3Uucg_yvELNrA0'

export const config = { maxDuration: 60 }

const MAX_MESSAGES = 20
const MAX_CHARS_PER_MESSAGE = 2000

const SYSTEM_PROMPT = `Eres EAN Assistant, un asistente empático, juvenil y amigable, exclusivo para estudiantes de la Universidad EAN en Bogotá. Tu objetivo es ayudar con la vida universitaria, ubicación de sedes, procesos y socialización. Si un estudiante menciona sentirse solo, triste o excluido, responde con extrema empatía y recomiéndale contactar a la línea de Bienestar Universitario de la EAN. Si te preguntan algo específico de la universidad que no sabes, no lo inventes; orienta al estudiante hacia los canales oficiales institucionales.

Pautas adicionales:
- Responde en español, con un tono cercano y respetuoso, en mensajes cortos (2 a 5 frases) y en texto plano, sin markdown ni encabezados.
- No inventes números de teléfono, correos, direcciones, horarios, fechas de matrícula, costos ni nombres de dependencias. Si no tienes el dato exacto, dilo y recomienda el portal web oficial de la EAN, la Secretaría Académica o Bienestar Universitario.
- Si el estudiante expresa ideas de hacerse daño o de no querer vivir, prioriza su seguridad: anímalo a buscar ayuda inmediata con alguien de confianza, con Bienestar Universitario y, en Colombia, con la línea de emergencias 123.
- Si te piden algo ajeno a la vida universitaria o inapropiado, redirige amablemente la conversación.`

type ChatRole = 'user' | 'assistant'
interface IncomingMessage {
  role: ChatRole
  content: string
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } })

function parseMessages(body: unknown): IncomingMessage[] | null {
  if (!body || typeof body !== 'object' || !Array.isArray((body as { messages?: unknown }).messages)) return null
  const raw = (body as { messages: unknown[] }).messages.slice(-MAX_MESSAGES)
  const messages: IncomingMessage[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') return null
    const { role, content } = m as Partial<IncomingMessage>
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) return null
    messages.push({ role, content: content.slice(0, MAX_CHARS_PER_MESSAGE) })
  }
  // La API exige que la conversación empiece con el usuario y termine con su último mensaje.
  while (messages.length && messages[0].role !== 'user') messages.shift()
  if (!messages.length || messages[messages.length - 1].role !== 'user') return null
  return messages
}

type Provider = 'gemini' | 'anthropic'

function resolveProvider(): Provider | null {
  const explicit = process.env.AI_PROVIDER?.toLowerCase()
  if (explicit === 'gemini' || explicit === 'anthropic') return explicit
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return null
}

class ChatError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

const REFUSAL_TEXT = 'No puedo ayudarte con eso, pero si es un tema de la U te recomiendo consultar los canales oficiales de la EAN.'

/* ─────────────── Gemini ─────────────── */

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])
const GEMINI_FIRST_CHUNK_TIMEOUT_MS = 10_000

function geminiModels() {
  const primary = process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite'
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.8-flash,gemini-3.6-flash').split(',').map((m) => m.trim()).filter(Boolean)
  return [...new Set([primary, ...fallbacks])]
}

async function* streamGemini(messages: IncomingMessage[]): AsyncGenerator<string> {
  if (!process.env.GEMINI_API_KEY) throw new ChatError('Falta GEMINI_API_KEY en el servidor.', 500)
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, '') })
  const contents = messages.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

  // Prueba el modelo principal y, si está saturado o no responde a tiempo, pasa al siguiente.
  for (const model of geminiModels()) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), GEMINI_FIRST_CHUNK_TIMEOUT_MS)
    let iterator: AsyncGenerator<{ text?: string }>
    let first: IteratorResult<{ text?: string }>
    try {
      iterator = await ai.models.generateContentStream({
        model,
        contents,
        config: {
          systemInstruction: SYSTEM_PROMPT,
          maxOutputTokens: 2048,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          abortSignal: controller.signal,
        },
      })
      first = await iterator.next()
    } catch (err) {
      clearTimeout(timer)
      const status = err instanceof GeminiApiError ? err.status : undefined
      // 404 = ese modelo no existe para esta key: se prueba el siguiente.
      if (controller.signal.aborted || status === 404 || (status !== undefined && RETRYABLE_STATUS.has(status))) {
        console.warn(`Gemini ${model} no disponible (${status ?? 'timeout'}); probando el siguiente modelo.`)
        continue
      }
      if (err instanceof GeminiApiError) {
        console.error(`Error de Gemini (${err.status}):`, err.message)
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          // Código corto para diagnosticar sin exponer detalles (ver SUPABASE_SETUP.txt, sección 10).
          const keyProblem = /api key|api_key|credential|access_token/i.test(err.message)
          const code = keyProblem ? 'G-KEY' : `G${err.status}`
          throw new ChatError(`El asistente no está disponible por un problema de configuración (código ${code}).`, 500)
        }
        throw new ChatError('El asistente no pudo responder. Intenta de nuevo.', 502)
      }
      throw err
    }
    clearTimeout(timer)

    let sent = false
    for (let chunk = first; !chunk.done; chunk = await iterator.next()) {
      const text = chunk.value.text
      if (text) {
        sent = true
        yield text
      }
    }
    // Gemini no devuelve texto cuando bloquea la respuesta por sus filtros de seguridad.
    if (!sent) yield REFUSAL_TEXT
    return
  }
  throw new ChatError('El asistente está muy ocupado en este momento. Intenta de nuevo en un minuto.', 503)
}

/* ─────────────── Claude ─────────────── */

async function* streamAnthropic(messages: IncomingMessage[]): AsyncGenerator<string> {
  if (!process.env.ANTHROPIC_API_KEY) throw new ChatError('Falta ANTHROPIC_API_KEY en el servidor.', 500)
  const client = new Anthropic() // lee ANTHROPIC_API_KEY de process.env
  const stream = client.beta.messages.stream({
    model: process.env.ANTHROPIC_MODEL || 'claude-opus-5-5',
    max_tokens: 2048,
    system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    output_config: { effort: 'low' },
    // Si el modelo declina por una política de seguridad, la API reintenta con un modelo alternativo.
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    messages,
  })
  try {
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text
    }
    const final = await stream.finalMessage()
    if (final.stop_reason === 'refusal') yield REFUSAL_TEXT
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) throw new ChatError('Hay muchas personas usando el asistente. Intenta en un minuto.', 429)
    if (err instanceof Anthropic.AuthenticationError) throw new ChatError('El asistente no está disponible por un problema de configuración.', 500)
    if (err instanceof Anthropic.APIError) {
      console.error(`Error de Claude (${err.status}):`, err.message)
      throw new ChatError('El asistente no pudo responder. Intenta de nuevo.', 502)
    }
    throw err
  } finally {
    stream.abort()
  }
}

/* ─────────────── Autenticación ─────────────── */

// Solo estudiantes con sesión de Supabase pueden usar el asistente (evita que terceros gasten tu cuota de IA).
async function isAuthenticated(request: Request): Promise<boolean | 'not-configured'> {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_KEY
  if (!url || !anonKey) return 'not-configured'
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return false
  const supabase = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.auth.getUser(token)
  return !error && Boolean(data.user)
}

/* ─────────────── Handler ─────────────── */

export async function POST(request: Request): Promise<Response> {
  const auth = await isAuthenticated(request)
  if (auth === 'not-configured') return json({ error: 'El asistente no está configurado (faltan las variables de Supabase en el servidor).' }, 500)
  if (!auth) return json({ error: 'Inicia sesión para usar EAN Assistant.' }, 401)

  const provider = resolveProvider()
  if (!provider) return json({ error: 'El asistente no está configurado (falta GEMINI_API_KEY en el servidor).' }, 500)

  let messages: IncomingMessage[] | null
  try {
    messages = parseMessages(await request.json())
  } catch {
    messages = null
  }
  if (!messages) return json({ error: 'Formato de mensajes inválido.' }, 400)

  const generator = provider === 'gemini' ? streamGemini(messages) : streamAnthropic(messages)

  // Espera el primer fragmento para poder devolver un error HTTP real si la petición falla de entrada.
  let first: IteratorResult<string>
  try {
    first = await generator.next()
  } catch (err) {
    if (err instanceof ChatError) return json({ error: err.message }, err.status)
    console.error('Error inesperado:', err)
    return json({ error: 'Error inesperado del servidor.' }, 500)
  }

  const encoder = new TextEncoder()
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        if (!first.done) controller.enqueue(encoder.encode(first.value))
        for (let next = await generator.next(); !next.done; next = await generator.next()) {
          controller.enqueue(encoder.encode(next.value))
        }
      } catch (err) {
        console.error('Error durante el streaming:', err)
        controller.enqueue(encoder.encode('\n\n[Se interrumpió la respuesta. Intenta de nuevo.]'))
      } finally {
        controller.close()
      }
    },
    cancel() {
      void generator.return(undefined)
    },
  })

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
  })
}
