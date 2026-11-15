import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ACTIVITY_CATEGORIES } from '../data/catalog'
import type { ActivityCategory } from '../types'
import { useActivities } from '../hooks/useActivities'
import { useProfiles } from '../hooks/useProfiles'
import { ActivityCard } from '../components/ActivityCard'
import { Chip } from '../components/Chip'
import { PageHeader } from '../components/PageHeader'
import { ErrorState, LoadingCards } from '../components/StateViews'
import { todayISO } from '../lib/utils'

type Filter = 'todas' | 'inscritas' | ActivityCategory

export default function Activities() {
  const { activities, enrolledIds, loading, error, pending, reload, toggleEnroll } = useActivities()
  const [filter, setFilter] = useState<Filter>('todas')
  const profiles = useProfiles(activities.flatMap((a) => a.attendee_ids.slice(0, 4)))

  const upcoming = activities.filter((a) => a.date >= todayISO())
  const list = upcoming.filter((a) =>
    filter === 'todas' ? true : filter === 'inscritas' ? enrolledIds.has(a.id) : a.category === filter,
  )

  return (
    <div>
      <PageHeader title="Actividades" subtitle={loading ? 'Cargando planes…' : `${upcoming.length} planes próximos`} />
      <div className="no-scrollbar sticky top-0 z-10 -mt-1 flex gap-2 overflow-x-auto bg-slate-50/90 px-5 py-3 backdrop-blur">
        <Chip active={filter === 'todas'} onClick={() => setFilter('todas')}>Todas</Chip>
        <Chip active={filter === 'inscritas'} onClick={() => setFilter('inscritas')}>Mis inscripciones ({upcoming.filter((a) => enrolledIds.has(a.id)).length})</Chip>
        {(Object.keys(ACTIVITY_CATEGORIES) as ActivityCategory[]).map((k) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
            {ACTIVITY_CATEGORIES[k].emoji} {ACTIVITY_CATEGORIES[k].label}
          </Chip>
        ))}
      </div>
      <div className="grid gap-5 px-5 pt-2 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          <div className="col-span-full"><LoadingCards height="h-80" /></div>
        ) : error ? (
          <div className="col-span-full"><ErrorState message={error} onRetry={reload} /></div>
        ) : (
          <>
            <AnimatePresence mode="popLayout">
              {list.map((a) => (
                <ActivityCard
                  key={a.id}
                  activity={a}
                  enrolled={enrolledIds.has(a.id)}
                  pending={pending.has(a.id)}
                  onToggle={toggleEnroll}
                  profiles={profiles}
                />
              ))}
            </AnimatePresence>
            {list.length === 0 && (
              <div className="col-span-full rounded-3xl bg-white p-8 text-center shadow-sm">
                <p className="text-3xl">🗓️</p>
                <p className="mt-2 font-semibold text-slate-800">Nada por aquí todavía</p>
                <p className="text-sm text-slate-500">
                  {filter === 'inscritas' ? 'Inscríbete en una actividad y aparecerá aquí.' : 'Pronto habrá actividades en esta categoría.'}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
