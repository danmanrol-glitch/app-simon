import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { Activity } from '../types'

type ActivityRow = Omit<Activity, 'attendee_ids'> & { enrollments: { user_id: string; created_at: string }[] }

export function useActivities() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const userId = session?.user.id
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setError(null)
    const { data, error } = await supabase
      .from('activities')
      .select('id, name, category, description, date, start_time, end_time, location, total_spots, organizer, tags, enrollments(user_id, created_at)')
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })
    if (error) {
      console.error(error)
      setError('No pudimos cargar las actividades.')
    } else {
      setActivities(
        (data as unknown as ActivityRow[]).map(({ enrollments, ...a }) => ({
          ...a,
          attendee_ids: [...enrollments].sort((x, y) => y.created_at.localeCompare(x.created_at)).map((e) => e.user_id),
        })),
      )
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const enrolledIds = new Set(activities.filter((a) => userId && a.attendee_ids.includes(userId)).map((a) => a.id))

  const toggleEnroll = async (activityId: string) => {
    if (!userId || pending.has(activityId)) return
    const activity = activities.find((a) => a.id === activityId)
    if (!activity) return
    const enrolled = activity.attendee_ids.includes(userId)
    if (!enrolled && activity.attendee_ids.length >= activity.total_spots) {
      showToast('Esta actividad ya no tiene cupos')
      return
    }

    const apply = (add: boolean) =>
      setActivities((prev) =>
        prev.map((a) =>
          a.id !== activityId
            ? a
            : { ...a, attendee_ids: add ? [userId, ...a.attendee_ids] : a.attendee_ids.filter((id) => id !== userId) },
        ),
      )

    setPending((p) => new Set(p).add(activityId))
    apply(!enrolled) // actualización optimista
    const { error } = enrolled
      ? await supabase.from('enrollments').delete().match({ activity_id: activityId, user_id: userId })
      : await supabase.from('enrollments').insert({ activity_id: activityId, user_id: userId })
    setPending((p) => {
      const next = new Set(p)
      next.delete(activityId)
      return next
    })

    if (error) {
      apply(enrolled) // revierte
      showToast(error.message.includes('ACTIVITY_FULL') ? 'Esta actividad ya no tiene cupos' : 'No se pudo guardar. Intenta de nuevo.')
      void load()
      return
    }
    showToast(enrolled ? 'Cancelaste tu inscripción' : '¡Listo! Quedaste inscrito 🎉')
  }

  return { activities, enrolledIds, loading, error, pending, reload: load, toggleEnroll }
}
