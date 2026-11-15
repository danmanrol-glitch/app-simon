// Contenido estático de la app (textos, catálogos y estilos). Los datos de usuarios,
// actividades y publicaciones viven en Supabase.
import type { ActivityCategory, PostCategory, PostType, ReactionType } from '../types'

export type TipCategory =
  | 'hacer-amigos'
  | 'iniciar-charlas'
  | 'superar-timidez'
  | 'primer-semestre'
  | 'manejar-soledad'
  | 'organizar-tiempo'
  | 'grupos-estudio'

export interface Tip {
  id: string
  category: TipCategory
  title: string
  body: string
  emoji: string
  readMinutes: number
}

export interface AppNotification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  kind: 'actividad' | 'comunidad' | 'bienestar' | 'sistema'
}

export interface WellbeingSurvey {
  id: string
  question: string
  options: { emoji: string; label: string }[]
}

export const TIP_CATEGORIES: Record<TipCategory, { label: string; color: string }> = {
  'hacer-amigos': { label: 'Hacer amigos', color: 'bg-amber-100 text-amber-800' },
  'iniciar-charlas': { label: 'Iniciar charlas', color: 'bg-sky-100 text-sky-800' },
  'superar-timidez': { label: 'Superar la timidez', color: 'bg-violet-100 text-violet-800' },
  'primer-semestre': { label: 'Primer semestre', color: 'bg-green-100 text-green-800' },
  'manejar-soledad': { label: 'Manejar la soledad', color: 'bg-rose-100 text-rose-800' },
  'organizar-tiempo': { label: 'Organizar tu tiempo', color: 'bg-teal-100 text-teal-800' },
  'grupos-estudio': { label: 'Grupos de estudio', color: 'bg-indigo-100 text-indigo-800' },
}

export const ACTIVITY_CATEGORIES: Record<ActivityCategory, { label: string; emoji: string; gradient: string }> = {
  deportes: { label: 'Deportes', emoji: '⚽', gradient: 'from-emerald-500 to-green-700' },
  'arte-cultura': { label: 'Arte y cultura', emoji: '🎨', gradient: 'from-fuchsia-500 to-purple-700' },
  emprendimiento: { label: 'Emprendimiento', emoji: '🚀', gradient: 'from-amber-400 to-orange-600' },
  juegos: { label: 'Juegos', emoji: '🎮', gradient: 'from-sky-500 to-indigo-600' },
  voluntariado: { label: 'Voluntariado', emoji: '🤝', gradient: 'from-rose-400 to-pink-600' },
  'grupos-estudio': { label: 'Grupos de estudio', emoji: '📚', gradient: 'from-teal-400 to-cyan-700' },
}

export const POST_CATEGORIES: Record<PostCategory, string> = {
  deportes: 'Deportes',
  academico: 'Académico',
  recreativo: 'Recreativo',
}

export const POST_TYPES: Record<PostType, { label: string; color: string }> = {
  plan: { label: 'Propone un plan', color: 'bg-green-100 text-green-800' },
  'busco-companeros': { label: 'Busca compañeros', color: 'bg-amber-100 text-amber-800' },
  general: { label: 'Publicación', color: 'bg-slate-100 text-slate-700' },
}

export const REACTIONS: Record<ReactionType, string> = {
  like: '👍',
  love: '💚',
  fun: '😂',
  support: '🙌',
}

export const MOTIVATIONAL_QUOTES = [
  'Cada experto alguna vez fue principiante. Hoy es un buen día para aprender algo nuevo.',
  'No tienes que tenerlo todo resuelto. Solo da el siguiente paso.',
  'Las mejores amistades de la U empiezan con un simple "¿esta silla está libre?".',
  'Emprender también es atreverse a preguntar.',
  'Tu ritmo es válido. Compararte solo te quita energía.',
  'Un café con alguien nuevo puede cambiar tu semestre.',
  'Descansar también es parte de rendir bien.',
]

export const INTEREST_OPTIONS = [
  'Fútbol', 'Running', 'Yoga', 'Fotografía', 'Música', 'Startups', 'Finanzas',
  'Videojuegos', 'Cine', 'Voluntariado', 'Idiomas', 'Marketing digital', 'Ajedrez', 'Baile',
]

export const tips: Tip[] = [
  { id: 't1', category: 'hacer-amigos', emoji: '👋', readMinutes: 1, title: 'Llega 5 minutos antes', body: 'Los minutos antes de clase son el momento más fácil para hablar con alguien: todos están esperando y nadie tiene prisa. Pregunta por la tarea o el profe y deja que fluya.' },
  { id: 't2', category: 'iniciar-charlas', emoji: '💬', readMinutes: 1, title: 'Preguntas abiertas, no de sí o no', body: 'En vez de "¿te gustó la clase?", prueba "¿qué te pareció lo que dijo el profe sobre…?". Las preguntas abiertas invitan a contar algo y la conversación dura más.' },
  { id: 't3', category: 'superar-timidez', emoji: '🌱', readMinutes: 2, title: 'Empieza con retos pequeños', body: 'Esta semana: saluda a una persona nueva por día. La timidez se reduce con práctica gradual, no con un salto enorme. Celebra cada pequeño avance.' },
  { id: 't4', category: 'primer-semestre', emoji: '🗺️', readMinutes: 2, title: 'Recorre el campus sin prisa', body: 'Dedica una hora a ubicar biblioteca, cafetería, Bienestar y tus salones. Llegar sin perderte te quita estrés y te hace sentir parte del lugar desde el día uno.' },
  { id: 't5', category: 'manejar-soledad', emoji: '💚', readMinutes: 2, title: 'Sentirte solo es más común de lo que crees', body: 'Muchos estudiantes nuevos se sienten así las primeras semanas. Únete a una actividad que te guste: compartir un interés hace más fácil conectar. Y si pesa demasiado, Bienestar Universitario está para escucharte.' },
  { id: 't6', category: 'organizar-tiempo', emoji: '⏰', readMinutes: 1, title: 'La regla de los 2 minutos', body: 'Si algo toma menos de 2 minutos (responder un correo, subir un archivo), hazlo ya. Para lo demás, bloquea tiempo en tu calendario como si fuera una clase.' },
  { id: 't7', category: 'grupos-estudio', emoji: '📚', readMinutes: 2, title: 'Grupos de 3 a 5 personas', body: 'Es el tamaño ideal: todos participan y es fácil cuadrar horarios. Definan un objetivo por sesión y roten quién explica cada tema.' },
  { id: 't8', category: 'hacer-amigos', emoji: '☕', readMinutes: 1, title: 'Invita, aunque sea un tinto', body: 'Un "¿vamos por un tinto después de clase?" es de bajo compromiso y abre la puerta a una amistad. Lo peor que pasa es un "hoy no puedo".' },
]

/* ─────────────────── Notificaciones y bienestar ─────────── */

// Notificaciones de ejemplo (aún no hay backend de notificaciones).
export const notifications: AppNotification[] = [
  { id: 'n1', kind: 'actividad', title: 'Quedan pocos cupos', body: 'Revisa las actividades de esta semana: algunas tienen pocos cupos.', time: 'Hace 10 min', read: false },
  { id: 'n2', kind: 'comunidad', title: 'Nuevo comentario', body: 'Alguien comentó en una publicación que sigues.', time: 'Hace 1 h', read: false },
  { id: 'n3', kind: 'bienestar', title: '¿Cómo te sientes esta semana?', body: 'Responde la encuesta de bienestar: toma 10 segundos.', time: 'Hace 3 h', read: false },
  { id: 'n4', kind: 'sistema', title: 'Recordatorio', body: 'Revisa tu calendario en Perfil para ver tus próximas actividades.', time: 'Ayer', read: true },
]

export const wellbeingSurvey: WellbeingSurvey = {
  id: 's1',
  question: '¿Cómo te has sentido esta semana en la U?',
  options: [
    { emoji: '😄', label: 'Genial' },
    { emoji: '🙂', label: 'Bien' },
    { emoji: '😐', label: 'Normal' },
    { emoji: '😔', label: 'Difícil' },
  ],
}

export const WELLBEING_CHANNEL = {
  name: 'Bienestar Universitario EAN',
  description: 'Acompañamiento psicológico y orientación para estudiantes. Consulta los canales oficiales en el portal de la universidad.',
}
