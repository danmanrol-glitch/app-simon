import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import {
  activities as seedActivities,
  CURRENT_USER_ID,
  getUser,
  notifications as seedNotifications,
  posts as seedPosts,
  type Activity,
  type AppNotification,
  type NotificationSettings,
  type Post,
  type PostFilter,
  type PostType,
  type PrivacySettings,
  type ReactionType,
  type User,
} from '../mock/db'

interface AppState {
  user: User
  activities: Activity[]
  enrolledIds: Set<string>
  posts: Post[]
  myReactions: Record<string, ReactionType | undefined>
  hiddenAuthorIds: Set<string>
  reportedPostIds: Set<string>
  notifications: AppNotification[]
  surveyAnswer: string | null
  toast: string | null
  toggleEnroll: (activityId: string) => void
  react: (postId: string, reaction: ReactionType) => void
  addComment: (postId: string, text: string) => void
  addPost: (input: { type: PostType; filter: PostFilter; text: string; when?: string; where?: string }) => void
  reportPost: (postId: string) => void
  blockAuthor: (authorId: string) => void
  markAllRead: () => void
  answerSurvey: (label: string) => void
  updatePrivacy: (patch: Partial<PrivacySettings>) => void
  updateNotifications: (patch: Partial<NotificationSettings>) => void
  updateInterests: (interests: string[]) => void
  showToast: (msg: string) => void
}

const AppContext = createContext<AppState | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(() => structuredClone(getUser(CURRENT_USER_ID)))
  const [activities, setActivities] = useState<Activity[]>(() => structuredClone(seedActivities))
  const [enrolledIds, setEnrolledIds] = useState<Set<string>>(
    () => new Set(seedActivities.filter((a) => a.attendeeIds.includes(CURRENT_USER_ID)).map((a) => a.id)),
  )
  const [posts, setPosts] = useState<Post[]>(() => structuredClone(seedPosts))
  const [myReactions, setMyReactions] = useState<Record<string, ReactionType | undefined>>({})
  const [hiddenAuthorIds, setHidden] = useState<Set<string>>(new Set())
  const [reportedPostIds, setReported] = useState<Set<string>>(new Set())
  const [notifications, setNotifications] = useState<AppNotification[]>(seedNotifications)
  const [surveyAnswer, setSurveyAnswer] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 2400)
  }

  const toggleEnroll = (id: string) => {
    const enrolled = enrolledIds.has(id)
    const activity = activities.find((a) => a.id === id)
    if (!activity) return
    if (!enrolled && activity.availableSpots <= 0) {
      showToast('Esta actividad ya no tiene cupos')
      return
    }
    setActivities((prev) =>
      prev.map((a) =>
        a.id !== id
          ? a
          : {
              ...a,
              availableSpots: a.availableSpots + (enrolled ? 1 : -1),
              attendeeIds: enrolled
                ? a.attendeeIds.filter((u) => u !== CURRENT_USER_ID)
                : [CURRENT_USER_ID, ...a.attendeeIds],
            },
      ),
    )
    setEnrolledIds((prev) => {
      const next = new Set(prev)
      if (enrolled) next.delete(id)
      else next.add(id)
      return next
    })
    showToast(enrolled ? 'Cancelaste tu inscripción' : '¡Listo! Quedaste inscrito 🎉')
  }

  const react = (postId: string, reaction: ReactionType) => {
    const current = myReactions[postId]
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const r = { ...p.reactions }
        if (current) r[current] -= 1
        if (current !== reaction) r[reaction] += 1
        return { ...p, reactions: r }
      }),
    )
    setMyReactions((prev) => ({ ...prev, [postId]: current === reaction ? undefined : reaction }))
  }

  const addComment = (postId: string, text: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                { id: crypto.randomUUID(), authorId: CURRENT_USER_ID, text, createdAt: new Date().toISOString() },
              ],
            }
          : p,
      ),
    )
  }

  const addPost: AppState['addPost'] = ({ type, filter, text, when, where }) => {
    const post: Post = {
      id: crypto.randomUUID(),
      authorId: CURRENT_USER_ID,
      type,
      filter,
      text,
      createdAt: new Date().toISOString(),
      reactions: { like: 0, love: 0, fun: 0, support: 0 },
      comments: [],
      planDetails: type === 'plan' && (when || where) ? { when: when ?? '', where: where ?? '' } : undefined,
    }
    setPosts((prev) => [post, ...prev])
    showToast('Publicación creada')
  }

  const reportPost = (postId: string) => {
    setReported((prev) => new Set(prev).add(postId))
    showToast('Gracias. Nuestro equipo revisará la publicación.')
  }

  const blockAuthor = (authorId: string) => {
    setHidden((prev) => new Set(prev).add(authorId))
    showToast('Usuario bloqueado. Ya no verás sus publicaciones.')
  }

  const value = useMemo<AppState>(
    () => ({
      user,
      activities,
      enrolledIds,
      posts,
      myReactions,
      hiddenAuthorIds,
      reportedPostIds,
      notifications,
      surveyAnswer,
      toast,
      toggleEnroll,
      react,
      addComment,
      addPost,
      reportPost,
      blockAuthor,
      markAllRead: () => setNotifications((n) => n.map((x) => ({ ...x, read: true }))),
      answerSurvey: (label) => {
        setSurveyAnswer(label)
        setNotifications((n) => n.map((x) => (x.kind === 'bienestar' ? { ...x, read: true } : x)))
      },
      updatePrivacy: (patch) => setUser((u) => ({ ...u, privacy: { ...u.privacy, ...patch } })),
      updateNotifications: (patch) => setUser((u) => ({ ...u, notifications: { ...u.notifications, ...patch } })),
      updateInterests: (interests) => setUser((u) => ({ ...u, interests })),
      showToast,
    }),
    [user, activities, enrolledIds, posts, myReactions, hiddenAuthorIds, reportedPostIds, notifications, surveyAnswer, toast],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>')
  return ctx
}
