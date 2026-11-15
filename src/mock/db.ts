// Datos simulados para el prototipo de EAN Connect.
// Nombres, lugares y fechas son ficticios y solo sirven para demostrar la UI.

/* ───────────────────────── Tipos ───────────────────────── */

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

export type ActivityCategory =
  | 'deportes'
  | 'arte-cultura'
  | 'emprendimiento'
  | 'juegos'
  | 'voluntariado'
  | 'grupos-estudio'

export interface Activity {
  id: string
  name: string
  category: ActivityCategory
  description: string
  date: string // ISO yyyy-mm-dd
  startTime: string // HH:mm
  endTime: string
  location: string
  totalSpots: number
  availableSpots: number
  attendeeIds: string[]
  tags: string[]
  organizer: string
}

export type PostFilter = 'deportes' | 'academico' | 'recreativo'
export type PostType = 'plan' | 'busco-companeros' | 'general'
export type ReactionType = 'like' | 'love' | 'fun' | 'support'

export interface Comment {
  id: string
  authorId: string
  text: string
  createdAt: string // ISO
}

export interface Post {
  id: string
  authorId: string
  type: PostType
  filter: PostFilter
  text: string
  createdAt: string
  reactions: Record<ReactionType, number>
  comments: Comment[]
  planDetails?: { when: string; where: string; spots?: number }
}

export interface PrivacySettings {
  showCareer: boolean
  showSemester: boolean
  showInterests: boolean
  showActivities: boolean
  showGroups: boolean
  profileVisibleTo: 'todos' | 'compañeros' | 'nadie'
}

export interface NotificationSettings {
  newActivities: boolean
  communityReplies: boolean
  reminders: boolean
  wellbeingSurveys: boolean
}

export interface User {
  id: string
  name: string
  nickname: string
  career: string
  semester: number
  bio: string
  interests: string[]
  favoriteActivities: ActivityCategory[]
  groups: string[]
  eventsAttended: number
  color: string // gradiente del avatar
  privacy: PrivacySettings
  notifications: NotificationSettings
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

/* ─────────────────────── Catálogos ─────────────────────── */

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

export const POST_FILTERS: Record<PostFilter, string> = {
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

/* ──────────────────────── Usuarios ─────────────────────── */

const defaultPrivacy: PrivacySettings = {
  showCareer: true,
  showSemester: true,
  showInterests: true,
  showActivities: true,
  showGroups: true,
  profileVisibleTo: 'todos',
}

const defaultNotifications: NotificationSettings = {
  newActivities: true,
  communityReplies: true,
  reminders: true,
  wellbeingSurveys: true,
}

export const CURRENT_USER_ID = 'u1'

export const users: User[] = [
  {
    id: 'u1',
    name: 'Valentina Rojas',
    nickname: 'Vale',
    career: 'Negocios Internacionales',
    semester: 2,
    bio: 'Me encanta conocer gente nueva y probar planes distintos. Siempre con un café en la mano ☕',
    interests: ['Startups', 'Fotografía', 'Running', 'Idiomas', 'Música'],
    favoriteActivities: ['emprendimiento', 'deportes', 'arte-cultura'],
    groups: ['Club de Emprendimiento', 'Running EAN', 'Intercambio de idiomas'],
    eventsAttended: 12,
    color: 'from-green-500 to-emerald-700',
    privacy: { ...defaultPrivacy },
    notifications: { ...defaultNotifications },
  },
  { id: 'u2', name: 'Santiago Gómez', nickname: 'Santi', career: 'Ingeniería de Sistemas', semester: 4, bio: '', interests: ['Videojuegos', 'Ajedrez'], favoriteActivities: ['juegos'], groups: ['Gamers EAN'], eventsAttended: 8, color: 'from-sky-500 to-indigo-600', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u3', name: 'Mariana López', nickname: 'Mari', career: 'Administración de Empresas', semester: 1, bio: '', interests: ['Yoga', 'Baile'], favoriteActivities: ['arte-cultura'], groups: [], eventsAttended: 2, color: 'from-fuchsia-500 to-purple-600', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u4', name: 'Andrés Martínez', nickname: 'Andy', career: 'Economía', semester: 6, bio: '', interests: ['Fútbol', 'Finanzas'], favoriteActivities: ['deportes'], groups: ['Selección de fútbol'], eventsAttended: 20, color: 'from-amber-400 to-orange-600', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u5', name: 'Laura Castillo', nickname: 'Lau', career: 'Mercadeo', semester: 3, bio: '', interests: ['Marketing digital', 'Cine'], favoriteActivities: ['emprendimiento'], groups: [], eventsAttended: 5, color: 'from-rose-400 to-pink-600', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u6', name: 'Juan Pablo Torres', nickname: 'JP', career: 'Ingeniería Ambiental', semester: 5, bio: '', interests: ['Voluntariado', 'Running'], favoriteActivities: ['voluntariado'], groups: [], eventsAttended: 11, color: 'from-teal-400 to-cyan-700', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u7', name: 'Camila Herrera', nickname: 'Cami', career: 'Lenguas Modernas', semester: 2, bio: '', interests: ['Idiomas', 'Música'], favoriteActivities: ['grupos-estudio'], groups: [], eventsAttended: 4, color: 'from-violet-500 to-purple-700', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u8', name: 'Daniel Ruiz', nickname: 'Dani', career: 'Negocios Internacionales', semester: 7, bio: '', interests: ['Startups', 'Finanzas'], favoriteActivities: ['emprendimiento'], groups: [], eventsAttended: 15, color: 'from-lime-500 to-green-700', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u9', name: 'Sofía Moreno', nickname: 'Sofi', career: 'Psicología', semester: 3, bio: '', interests: ['Yoga', 'Voluntariado'], favoriteActivities: ['voluntariado'], groups: [], eventsAttended: 7, color: 'from-orange-400 to-red-500', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
  { id: 'u10', name: 'Felipe Vargas', nickname: 'Pipe', career: 'Diseño Gráfico', semester: 4, bio: '', interests: ['Fotografía', 'Cine'], favoriteActivities: ['arte-cultura'], groups: [], eventsAttended: 9, color: 'from-cyan-500 to-blue-600', privacy: { ...defaultPrivacy }, notifications: { ...defaultNotifications } },
]

export const getUser = (id: string) => users.find((u) => u.id === id) ?? users[0]

/* ─────────────────────────── Tips ───────────────────────── */

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

/* ──────────────────────── Actividades ───────────────────── */

export const activities: Activity[] = [
  { id: 'a1', name: 'Torneo relámpago de fútbol 5', category: 'deportes', description: 'Arma tu equipo o inscríbete solo y te asignamos uno. Partidos de 15 minutos, buena energía y premios para los tres primeros.', date: '2026-11-18', startTime: '14:00', endTime: '17:00', location: 'Cancha sintética – Sede El Nogal', totalSpots: 40, availableSpots: 9, attendeeIds: ['u4', 'u2', 'u6', 'u8', 'u10'], tags: ['Fútbol'], organizer: 'Bienestar Universitario' },
  { id: 'a2', name: 'Taller de fotografía con celular', category: 'arte-cultura', description: 'Aprende composición, luz y edición básica usando solo tu celular. Terminamos con una salida fotográfica por el barrio.', date: '2026-11-19', startTime: '10:00', endTime: '12:00', location: 'Sala creativa, piso 3 – Sede Legacy', totalSpots: 20, availableSpots: 6, attendeeIds: ['u10', 'u3', 'u7'], tags: ['Fotografía'], organizer: 'Club de Arte EAN' },
  { id: 'a3', name: 'Pitch Night: valida tu idea', category: 'emprendimiento', description: 'Presenta tu idea de negocio en 3 minutos y recibe feedback de mentores y emprendedores egresados. No necesitas tener nada construido.', date: '2026-11-20', startTime: '18:00', endTime: '20:30', location: 'Auditorio principal – Sede El Nogal', totalSpots: 80, availableSpots: 31, attendeeIds: ['u8', 'u5', 'u4', 'u2'], tags: ['Startups', 'Finanzas'], organizer: 'Centro de Emprendimiento' },
  { id: 'a4', name: 'Noche de juegos de mesa', category: 'juegos', description: 'Catan, Uno, Dixit y más. Ideal para conocer gente sin presión: llegas, te sientas en una mesa y juegas.', date: '2026-11-21', startTime: '16:00', endTime: '19:00', location: 'Zona de bienestar, piso 2 – Sede Legacy', totalSpots: 30, availableSpots: 12, attendeeIds: ['u2', 'u7', 'u3', 'u9'], tags: ['Videojuegos', 'Ajedrez'], organizer: 'Gamers EAN' },
  { id: 'a5', name: 'Siembra de árboles en los cerros', category: 'voluntariado', description: 'Jornada de reforestación con una fundación aliada. Incluye transporte desde la universidad y refrigerio. Usa ropa cómoda.', date: '2026-11-22', startTime: '07:00', endTime: '13:00', location: 'Punto de encuentro: entrada principal – Sede El Nogal', totalSpots: 25, availableSpots: 0, attendeeIds: ['u6', 'u9', 'u4'], tags: ['Voluntariado'], organizer: 'Voluntariado EAN' },
  { id: 'a6', name: 'Grupo de estudio: Cálculo diferencial', category: 'grupos-estudio', description: 'Repaso para el parcial final con monitores. Trae tus dudas y ejercicios; trabajamos en mesas pequeñas.', date: '2026-11-24', startTime: '12:00', endTime: '14:00', location: 'Biblioteca, sala 4 – Sede El Nogal', totalSpots: 15, availableSpots: 4, attendeeIds: ['u3', 'u7', 'u2'], tags: ['Finanzas'], organizer: 'Monitorías académicas' },
  { id: 'a7', name: 'Running club al amanecer', category: 'deportes', description: '5 km a ritmo suave, todos los niveles. Terminamos con estiramientos y café.', date: '2026-11-25', startTime: '06:30', endTime: '07:45', location: 'Parque El Virrey (salida desde la Sede El Nogal)', totalSpots: 35, availableSpots: 18, attendeeIds: ['u6', 'u1', 'u4'], tags: ['Running'], organizer: 'Running EAN' },
  { id: 'a8', name: 'Intercambio de idiomas: English & Coffee', category: 'arte-cultura', description: 'Conversación en inglés en mesas temáticas, guiada por estudiantes de Lenguas Modernas. Todos los niveles bienvenidos.', date: '2026-11-26', startTime: '15:00', endTime: '16:30', location: 'Cafetería – Sede Legacy', totalSpots: 24, availableSpots: 10, attendeeIds: ['u7', 'u1', 'u5'], tags: ['Idiomas', 'Música'], organizer: 'Club de Idiomas' },
]

/* ───────────────────────── Comunidad ────────────────────── */

export const posts: Post[] = [
  { id: 'p1', authorId: 'u4', type: 'busco-companeros', filter: 'deportes', text: '¡Nos faltan 2 jugadores para el torneo de fútbol 5 del miércoles! No importa el nivel, la idea es pasarla bien ⚽', createdAt: '2026-11-15T09:20:00', reactions: { like: 14, love: 3, fun: 1, support: 6 }, comments: [ { id: 'c1', authorId: 'u2', text: '¡Yo me apunto! Juego de defensa.', createdAt: '2026-11-15T09:45:00' }, { id: 'c2', authorId: 'u10', text: 'Si queda un cupo, cuenta conmigo.', createdAt: '2026-11-15T10:02:00' } ] },
  { id: 'p2', authorId: 'u7', type: 'plan', filter: 'recreativo', text: '¿Alguien se anima a ir a la Feria del Libro de la biblioteca y luego a comer? Plan tranqui para conocer gente 📚🍕', createdAt: '2026-11-15T08:05:00', reactions: { like: 22, love: 9, fun: 0, support: 4 }, comments: [ { id: 'c3', authorId: 'u3', text: 'Me encanta, soy nueva y no conozco a casi nadie 🙈', createdAt: '2026-11-15T08:30:00' } ], planDetails: { when: 'Sábado 21 nov · 11:00 a. m.', where: 'Biblioteca – Sede El Nogal', spots: 6 } },
  { id: 'p3', authorId: 'u2', type: 'busco-companeros', filter: 'academico', text: 'Busco grupo de estudio para Estructuras de Datos. Propongo reunirnos martes y jueves después de las 4 p. m. en la biblioteca.', createdAt: '2026-11-14T19:40:00', reactions: { like: 9, love: 0, fun: 0, support: 5 }, comments: [] },
  { id: 'p4', authorId: 'u5', type: 'general', filter: 'academico', text: 'Tip para los de primer semestre: los monitores de matemáticas son lo máximo, aprovechen las monitorías antes de los parciales 🙌', createdAt: '2026-11-14T15:10:00', reactions: { like: 31, love: 12, fun: 0, support: 18 }, comments: [ { id: 'c4', authorId: 'u1', text: '¡Totalmente! Me salvaron en el primer corte.', createdAt: '2026-11-14T16:00:00' } ] },
  { id: 'p5', authorId: 'u9', type: 'plan', filter: 'recreativo', text: 'Clase de yoga al aire libre este viernes. Traigan toalla o mat, yo llevo música relajante 🧘', createdAt: '2026-11-14T11:00:00', reactions: { like: 17, love: 8, fun: 0, support: 3 }, comments: [], planDetails: { when: 'Viernes 20 nov · 7:00 a. m.', where: 'Terraza – Sede Legacy', spots: 12 } },
  { id: 'p6', authorId: 'u6', type: 'busco-companeros', filter: 'deportes', text: '¿Quién quiere empezar a correr? Estoy armando un grupo para principiantes, 3 km dos veces por semana 🏃', createdAt: '2026-11-13T18:30:00', reactions: { like: 12, love: 2, fun: 0, support: 7 }, comments: [] },
]

/* ─────────────────── Notificaciones y bienestar ─────────── */

export const notifications: AppNotification[] = [
  { id: 'n1', kind: 'actividad', title: 'Quedan pocos cupos', body: 'El Torneo relámpago de fútbol 5 tiene solo 9 cupos disponibles.', time: 'Hace 10 min', read: false },
  { id: 'n2', kind: 'comunidad', title: 'Nuevo comentario', body: 'Camila respondió a tu comentario en "Feria del Libro".', time: 'Hace 1 h', read: false },
  { id: 'n3', kind: 'bienestar', title: '¿Cómo te sientes esta semana?', body: 'Responde la encuesta de bienestar: toma 10 segundos.', time: 'Hace 3 h', read: false },
  { id: 'n4', kind: 'sistema', title: 'Recordatorio', body: 'Mañana es el Running club al amanecer. ¡No olvides tus tenis!', time: 'Ayer', read: true },
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
