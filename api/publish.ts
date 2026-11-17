// Vercel Function: publica posts y comentarios de la Comunidad después de revisarlos con IA (Gemini).
// Los estudiantes ya no pueden insertar posts ni comentarios directamente en Supabase (ver
// supabase/migrations/003_moderacion_ia.sql): solo esta función, con la secret key del servidor.
import { ApiError as GeminiApiError, GoogleGenAI, ThinkingLevel } from '@google/genai'
import { createClient } from '@supabase/supabase-js'

// Valores públicos de Supabase (los mismos de src/config.ts). Se repiten aquí porque las funciones
// de Vercel corren como ESM y un import relativo sin extensión rompe la función.
const PUBLIC_SUPABASE_URL = 'https://iikzjjamjbxbrqleebzc.supabase.co'
const PUBLIC_SUPABASE_KEY = 'sb_publishable_lGGPMgGduL41eFIRB3Uucg_yvELNrA0'
const IMAGES_BUCKET = 'post-images'

export const config = { maxDuration: 60 }

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })

const supabaseUrl = () => process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || PUBLIC_SUPABASE_URL
const supabaseAnonKey = () => process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || PUBLIC_SUPABASE_KEY

/* ─────────────── Validación de entrada ─────────────── */

const POST_TYPES = ['plan', 'busco-companeros', 'general'] as const
const POST_CATEGORIES = ['deportes', 'academico', 'recreativo'] as const
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface PostInput {
  kind: 'post'
  type: (typeof POST_TYPES)[number]
  category: (typeof POST_CATEGORIES)[number]
  text: string
  plan_when: string | null
  plan_where: string | null
  image_path: string | null
}

interface CommentInput {
  kind: 'comment'
  post_id: string
  text: string
}

const optionalText = (v: unknown, max: number) => (typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null)

function parseInput(body: unknown, userId: string): PostInput | CommentInput | string {
  if (!body || typeof body !== 'object') return 'Solicitud inválida.'
  const b = body as Record<string, unknown>
  const text = typeof b.text === 'string' ? b.text.trim() : ''

  if (b.kind === 'comment') {
    if (typeof b.post_id !== 'string' || !UUID.test(b.post_id)) return 'Publicación inválida.'
    if (!text || text.length > 300) return 'El comentario debe tener entre 1 y 300 caracteres.'
    return { kind: 'comment', post_id: b.post_id, text }
  }

  if (b.kind === 'post') {
    if (!POST_TYPES.includes(b.type as PostInput['type'])) return 'Tipo de publicación inválido.'
    if (!POST_CATEGORIES.includes(b.category as PostInput['category'])) return 'Categoría inválida.'
    if (!text || text.length > 400) return 'La publicación debe tener entre 1 y 400 caracteres.'
    let imagePath: string | null = null
    if (b.image_path != null) {
      const path = String(b.image_path)
      const valid = new RegExp(`^${userId}/[0-9a-f-]{36}\\.jpg$`, 'i').test(path)
      if (!valid) return 'Foto inválida.'
      imagePath = path
    }
    const isPlan = b.type === 'plan'
    return {
      kind: 'post',
      type: b.type as PostInput['type'],
      category: b.category as PostInput['category'],
      text,
      plan_when: isPlan ? optionalText(b.plan_when, 80) : null,
      plan_where: isPlan ? optionalText(b.plan_where, 80) : null,
      image_path: imagePath,
    }
  }
  return 'Solicitud inválida.'
}

/* ─────────────── Moderación con Gemini ─────────────── */

type Decision = 'allow' | 'review' | 'block'
interface Moderation {
  decision: Decision
  categories: string[]
  reason: string
}

const MODERATION_PROMPT = `Eres el moderador de contenido de EAN Connect, la comunidad en línea de estudiantes de la Universidad EAN (Bogotá, Colombia). Evalúa el contenido que un estudiante quiere publicar (texto y, si hay, una foto) y decide:

- "block": no se publica. Incluye: insultos o ataques dirigidos a una persona o grupo; acoso, burlas humillantes o matoneo; discriminación u odio por raza, etnia, género, orientación sexual, religión, discapacidad, origen o condición socioeconómica; amenazas o incitación a la violencia; contenido sexual explícito o desnudos; contenido sexual relacionado con menores; imágenes violentas o sangrientas; venta o promoción de drogas, armas o actividades ilegales; publicación de datos personales de otros (teléfonos, direcciones, documentos) sin su consentimiento; estafas, spam o enlaces sospechosos; incitar a autolesionarse.
- "review": se publica pero un administrador lo revisa. Incluye: casos dudosos o ambiguos; groserías fuertes sin un destinatario claro; un estudiante que expresa angustia, tristeza profunda o ideas de hacerse daño (no lo bloquees: necesita apoyo, no censura).
- "allow": todo lo demás.

Ten en cuenta el español coloquial colombiano: expresiones como "parce", "qué chimba", "marica" entre amigos sin intención de ofender, o una grosería suelta de emoción ("uy, qué examen tan hp de difícil"), son normales y se permiten. Las críticas respetuosas a la universidad, a profesores o a procesos también se permiten.

Responde solo con el JSON pedido. En "reason", si decides "block", explica en una frase corta, amable y en español, dirigida al estudiante, por qué no se puede publicar (sin repetir el contenido ofensivo). Si decides "allow", deja "reason" vacío.`

const MODERATION_SCHEMA = {
  type: 'object',
  properties: {
    decision: { type: 'string', enum: ['allow', 'review', 'block'] },
    categories: { type: 'array', items: { type: 'string' } },
    reason: { type: 'string' },
  },
  required: ['decision', 'categories', 'reason'],
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504])

function moderationModels() {
  const primary = process.env.GEMINI_MODERATION_MODEL || 'gemini-3.5-flash-lite'
  const fallbacks = (process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.8-flash,gemini-3.6-flash').split(',').map((m) => m.trim()).filter(Boolean)
  return [...new Set([primary, ...fallbacks])]
}

async function fetchImage(path: string): Promise<{ data: string; mimeType: string }> {
  const url = `${supabaseUrl()}/storage/v1/object/public/${IMAGES_BUCKET}/${path}`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`No se encontró la foto (${res.status}).`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > 5 * 1024 * 1024) throw new Error('La foto supera 5 MB.')
  return { data: buf.toString('base64'), mimeType: res.headers.get('content-type') || 'image/jpeg' }
}

/**
 * Devuelve la decisión de la IA. Si Gemini no está disponible, no bloquea la Comunidad:
 * publica el contenido marcado como "review" para que un administrador lo revise.
 */
async function moderate(text: string, image: { data: string; mimeType: string } | null): Promise<Moderation> {
  if (!process.env.GEMINI_API_KEY) {
    console.error('Moderación sin GEMINI_API_KEY: se marca para revisión.')
    return { decision: 'review', categories: ['sin_moderacion'], reason: '' }
  }
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY.trim().replace(/^["']|["']$/g, '') })
  const parts: { text?: string; inlineData?: { data: string; mimeType: string } }[] = [
    { text: `Texto a evaluar:\n"""\n${text}\n"""` },
  ]
  if (image) parts.push({ text: 'Foto adjunta a la publicación:' }, { inlineData: image })

  for (const model of moderationModels()) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15_000)
    try {
      const res = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: MODERATION_PROMPT,
          responseMimeType: 'application/json',
          responseJsonSchema: MODERATION_SCHEMA,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          maxOutputTokens: 512,
          abortSignal: controller.signal,
        },
      })
      clearTimeout(timer)
      const raw = res.text
      // Sin texto = Gemini bloqueó el contenido con sus propios filtros de seguridad.
      if (!raw) return { decision: 'block', categories: ['bloqueado_por_filtro'], reason: 'Este contenido no cumple las normas de la comunidad.' }
      const parsed = JSON.parse(raw) as Partial<Moderation>
      const decision: Decision = parsed.decision === 'block' || parsed.decision === 'review' ? parsed.decision : 'allow'
      return {
        decision,
        categories: Array.isArray(parsed.categories) ? parsed.categories.map(String).slice(0, 5) : [],
        reason: typeof parsed.reason === 'string' ? parsed.reason.slice(0, 200) : '',
      }
    } catch (err) {
      clearTimeout(timer)
      const status = err instanceof GeminiApiError ? err.status : undefined
      if (controller.signal.aborted || (status !== undefined && RETRYABLE_STATUS.has(status))) {
        console.warn(`Moderación: ${model} no disponible (${status ?? 'timeout'}).`)
        continue
      }
      console.error('Error de moderación:', err)
      break
    }
  }
  return { decision: 'review', categories: ['moderacion_no_disponible'], reason: '' }
}

/* ─────────────── Handler ─────────────── */

export async function POST(request: Request): Promise<Response> {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) return json({ error: 'La Comunidad no está configurada (falta SUPABASE_SECRET_KEY en el servidor).' }, 500)

  // 1. Quién publica: se valida el token de sesión del estudiante.
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim()
  if (!token) return json({ error: 'Inicia sesión para publicar.' }, 401)
  const authClient = createClient(supabaseUrl(), supabaseAnonKey(), { auth: { persistSession: false, autoRefreshToken: false } })
  const { data: userData, error: userError } = await authClient.auth.getUser(token)
  if (userError || !userData.user) return json({ error: 'Tu sesión expiró. Inicia sesión de nuevo.' }, 401)
  const userId = userData.user.id

  // 2. Qué publica.
  let input: PostInput | CommentInput | string
  try {
    input = parseInput(await request.json(), userId)
  } catch {
    input = 'Solicitud inválida.'
  }
  if (typeof input === 'string') return json({ error: input }, 400)

  const admin = createClient(supabaseUrl(), secretKey, { auth: { persistSession: false, autoRefreshToken: false } })
  const removeImage = async () => {
    if (input.kind === 'post' && input.image_path) await admin.storage.from(IMAGES_BUCKET).remove([input.image_path])
  }

  // 3. Moderación con IA.
  let image: { data: string; mimeType: string } | null = null
  if (input.kind === 'post' && input.image_path) {
    try {
      image = await fetchImage(input.image_path)
    } catch (err) {
      console.error(err)
      return json({ error: 'No pudimos leer la foto. Intenta subirla de nuevo.' }, 400)
    }
  }
  const verdict = await moderate(input.text, image)
  if (verdict.decision === 'block') {
    await removeImage()
    console.info(`Contenido bloqueado (${input.kind}) de ${userId}: ${verdict.categories.join(', ')}`)
    return json({ error: verdict.reason || 'Tu publicación no cumple las normas de la comunidad.', blocked: true }, 422)
  }
  const moderation = {
    moderation_status: verdict.decision === 'review' ? 'review' : 'approved',
    moderation_categories: verdict.categories,
  }

  // 4. Guardar con la secret key (los estudiantes ya no pueden insertar directamente).
  if (input.kind === 'post') {
    const { data, error } = await admin
      .from('posts')
      .insert({
        author_id: userId,
        type: input.type,
        category: input.category,
        text: input.text,
        plan_when: input.plan_when,
        plan_where: input.plan_where,
        image_path: input.image_path,
        ...moderation,
      })
      .select('id, author_id, type, category, text, plan_when, plan_where, plan_spots, image_path, created_at')
      .single()
    if (error) {
      console.error('Error al guardar post:', error)
      await removeImage()
      return json({ error: 'No se pudo publicar. Intenta de nuevo.' }, 500)
    }
    return json({ post: data }, 201)
  }

  const { data, error } = await admin
    .from('comments')
    .insert({ post_id: input.post_id, author_id: userId, text: input.text, ...moderation })
    .select('id, post_id, author_id, text, created_at')
    .single()
  if (error) {
    console.error('Error al guardar comentario:', error)
    return json({ error: error.code === '23503' ? 'La publicación ya no existe.' : 'No se pudo enviar el comentario.' }, error.code === '23503' ? 404 : 500)
  }
  return json({ comment: data }, 201)
}
