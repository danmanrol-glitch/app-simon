import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useApp } from '../context/AppContext'
import { ACTIVITY_CATEGORIES, type ActivityCategory } from '../mock/db'
import { ActivityCard } from '../components/ActivityCard'
import { Chip } from '../components/Chip'
import { PageHeader } from '../components/PageHeader'

type Filter = 'todas' | 'inscritas' | ActivityCategory

export default function Activities() {
  const { activities, enrolledIds } = useApp()
  const [filter, setFilter] = useState<Filter>('todas')

  const list = activities.filter((a) =>
    filter === 'todas' ? true : filter === 'inscritas' ? enrolledIds.has(a.id) : a.category === filter,
  )

  return (
    <div>
      <PageHeader title="Actividades" subtitle={`${activities.length} planes esta semana y la próxima`} />
      <div className="no-scrollbar sticky top-0 z-10 -mt-1 flex gap-2 overflow-x-auto bg-slate-50/90 px-5 py-3 backdrop-blur">
        <Chip active={filter === 'todas'} onClick={() => setFilter('todas')}>Todas</Chip>
        <Chip active={filter === 'inscritas'} onClick={() => setFilter('inscritas')}>Mis inscripciones ({enrolledIds.size})</Chip>
        {(Object.keys(ACTIVITY_CATEGORIES) as ActivityCategory[]).map((k) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>
            {ACTIVITY_CATEGORIES[k].emoji} {ACTIVITY_CATEGORIES[k].label}
          </Chip>
        ))}
      </div>
      <div className="space-y-5 px-5 pt-2">
        <AnimatePresence mode="popLayout">
          {list.map((a) => <ActivityCard key={a.id} activity={a} />)}
        </AnimatePresence>
        {list.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-3xl">🗓️</p>
            <p className="mt-2 font-semibold text-slate-800">Nada por aquí todavía</p>
            <p className="text-sm text-slate-500">
              {filter === 'inscritas' ? 'Inscríbete en una actividad y aparecerá aquí.' : 'Pronto habrá actividades en esta categoría.'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
