// Tipos de las filas de Supabase (ver supabase/schema.sql).

export type ActivityCategory = 'deportes' | 'arte-cultura' | 'emprendimiento' | 'juegos' | 'voluntariado' | 'grupos-estudio'
export type PostCategory = 'deportes' | 'academico' | 'recreativo'
export type PostType = 'plan' | 'busco-companeros' | 'general'
export type ReactionType = 'like' | 'love' | 'fun' | 'support'

export interface PrivacySettings {
  showCareer: boolean
  showSemester: boolean
  showInterests: boolean
  showActivities: boolean
  profileVisibleTo: 'todos' | 'nadie'
}

export interface NotificationSettings {
  newActivities: boolean
  communityReplies: boolean
  reminders: boolean
  wellbeingSurveys: boolean
}

/** Fila completa de `profiles` (solo visible para su dueño). */
export interface Profile {
  id: string
  full_name: string
  nickname: string
  career: string
  semester: number
  bio: string
  interests: string[]
  favorite_activities: ActivityCategory[]
  privacy: PrivacySettings
  notifications: NotificationSettings
}

/** Fila de la vista `public_profiles` (respeta la privacidad de cada usuario). */
export interface PublicProfile {
  id: string
  full_name: string
  nickname: string
  career: string | null
  semester: number | null
  interests: string[] | null
}

export interface Activity {
  id: string
  name: string
  category: ActivityCategory
  description: string
  date: string // yyyy-mm-dd
  start_time: string // HH:mm:ss
  end_time: string
  location: string
  total_spots: number
  organizer: string
  tags: string[]
  /** Calculado en el cliente a partir de `enrollments`. */
  attendee_ids: string[]
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  text: string
  created_at: string
}

export interface Post {
  id: string
  author_id: string
  type: PostType
  category: PostCategory
  text: string
  plan_when: string | null
  plan_where: string | null
  plan_spots: number | null
  created_at: string
  comments: Comment[]
  reactions: Record<ReactionType, number>
  my_reaction: ReactionType | null
}
