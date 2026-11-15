// Vercel Function (Node.js runtime, Web handler) que conecta EAN Assistant con la API de Claude.
// La API key se lee solo del entorno del servidor (ANTHROPIC_API_KEY) y nunca llega al navegador.
import Anthropic from '@anthropic-ai/sdk'

export const config = { maxDuration: 60 }

const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5'
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

function parseMessages(body: unknown): Anthropic.Beta.BetaMessageParam[] | null {
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

export async function POST(request: Request): Promise<Response> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return json({ error: 'El asistente no está configurado (falta ANTHROPIC_API_KEY en el servidor).' }, 500)
  }

  let messages: Anthropic.Beta.BetaMessageParam[] | null
  try {
    messages = parseMessages(await request.json())
  } catch {
    messages = null
  }
  if (!messages) return json({ error: 'Formato de mensajes inválido.' }, 400)

  const client = new Anthropic() // lee ANTHROPIC_API_KEY de process.env

  try {
    const stream = client.beta.messages.stream({
      model: MODEL,
      max_tokens: 2048,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      output_config: { effort: 'low' },
      // Si el modelo declina por una política de seguridad, la API reintenta con un modelo alternativo.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      messages,
    })

    // Espera el primer evento para poder devolver un error HTTP real si la petición falla de entrada.
    const iterator = stream[Symbol.asyncIterator]()
    const first = await iterator.next()
    const encoder = new TextEncoder()

    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        const push = (event: IteratorResult<Anthropic.Beta.BetaRawMessageStreamEvent>) => {
          if (!event.done && event.value.type === 'content_block_delta' && event.value.delta.type === 'text_delta') {
            controller.enqueue(encoder.encode(event.value.delta.text))
          }
        }
        try {
          push(first)
          for (let next = await iterator.next(); !next.done; next = await iterator.next()) push(next)
          const final = await stream.finalMessage()
          if (final.stop_reason === 'refusal') {
            controller.enqueue(
              encoder.encode('No puedo ayudarte con eso, pero si es un tema de la U te recomiendo consultar los canales oficiales de la EAN.'),
            )
          }
        } catch (err) {
          console.error('Error durante el streaming:', err)
          controller.enqueue(encoder.encode('\n\n[Se interrumpió la respuesta. Intenta de nuevo.]'))
        } finally {
          controller.close()
        }
      },
      cancel() {
        stream.abort()
      },
    })

    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' },
    })
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      console.error('API key inválida')
      return json({ error: 'El asistente no está disponible por un problema de configuración.' }, 500)
    }
    if (err instanceof Anthropic.RateLimitError) {
      return json({ error: 'Hay muchas personas usando el asistente. Intenta en un minuto.' }, 429)
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`Error de la API (${err.status}):`, err.message)
      return json({ error: 'El asistente no pudo responder. Intenta de nuevo.' }, 502)
    }
    console.error('Error inesperado:', err)
    return json({ error: 'Error inesperado del servidor.' }, 500)
  }
}
