import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { POST_CATEGORIES, POST_TYPES } from '../data/catalog'
import type { PostCategory, PostType } from '../types'
import { useAuth } from '../context/AuthContext'
import { useCommunity, type NewPostInput } from '../hooks/useCommunity'
import { useProfiles } from '../hooks/useProfiles'
import { ErrorState, LoadingCards } from '../components/StateViews'
import { PageHeader } from '../components/PageHeader'
import { Chip } from '../components/Chip'
import { PostCard } from '../components/PostCard'
import { Sheet } from '../components/Sheet'
import { cn } from '../lib/utils'

export default function Community() {
  const { session } = useAuth()
  const { posts, blockedIds, reportedIds, loading, error, reload, addPost, react, addComment, reportPost, blockAuthor } = useCommunity()
  const [filter, setFilter] = useState<PostCategory | 'todos'>('todos')
  const [composer, setComposer] = useState(false)
  const profiles = useProfiles(posts.flatMap((p) => [p.author_id, ...p.comments.map((c) => c.author_id)]))

  const list = posts.filter((p) => !blockedIds.has(p.author_id) && (filter === 'todos' || p.category === filter))

  return (
    <div>
      <PageHeader
        title="Comunidad"
        subtitle="Planes, compañeros y buena vibra"
        action={
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={() => setComposer(true)}
            aria-label="Crear publicación"
            className="grid h-11 w-11 place-items-center rounded-2xl bg-green-700 text-white shadow-sm shadow-green-900/20 hover:bg-green-800"
          >
            <Plus size={22} />
          </motion.button>
        }
      />
      <div className="no-scrollbar sticky top-0 z-10 -mt-1 flex gap-2 overflow-x-auto bg-slate-50/90 px-5 py-3 backdrop-blur">
        <Chip active={filter === 'todos'} onClick={() => setFilter('todos')}>Todos</Chip>
        {(Object.keys(POST_CATEGORIES) as PostCategory[]).map((k) => (
          <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{POST_CATEGORIES[k]}</Chip>
        ))}
      </div>
      <div className="space-y-4 px-5 pt-2">
        {loading ? (
          <LoadingCards height="h-48" />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : (
          <AnimatePresence mode="popLayout">
            {list.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={session?.user.id ?? ''}
                profiles={profiles}
                blockedIds={blockedIds}
                reported={reportedIds.has(p.id)}
                onReact={react}
                onComment={addComment}
                onReport={reportPost}
                onBlock={blockAuthor}
              />
            ))}
          </AnimatePresence>
        )}
        {!loading && !error && list.length === 0 && (
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="text-3xl">💬</p>
            <p className="mt-2 font-semibold text-slate-800">Aún no hay publicaciones aquí</p>
            <p className="text-sm text-slate-500">¡Sé la primera persona en proponer algo!</p>
          </div>
        )}
      </div>
      <Composer open={composer} onClose={() => setComposer(false)} onSubmit={addPost} />
    </div>
  )
}

function Composer({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit: (input: NewPostInput) => Promise<boolean> }) {
  const [type, setType] = useState<PostType>('plan')
  const [filter, setFilter] = useState<PostCategory>('recreativo')
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [when, setWhen] = useState('')
  const [where, setWhere] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim() || sending) return
    setSending(true)
    const ok = await onSubmit({ type, category: filter, text: text.trim(), planWhen: when.trim(), planWhere: where.trim() })
    setSending(false)
    if (!ok) return
    setText(''); setWhen(''); setWhere('')
    onClose()
  }

  const input = 'w-full rounded-2xl bg-slate-50 px-4 py-3 text-sm outline-none ring-green-600/30 focus:ring-2'

  return (
    <Sheet open={open} onClose={onClose} title="Nueva publicación">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">¿Qué quieres hacer?</p>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(POST_TYPES) as PostType[]).map((k) => (
              <button
                type="button"
                key={k}
                onClick={() => setType(k)}
                className={cn('rounded-2xl px-2 py-3 text-xs font-semibold transition-colors', type === k ? 'bg-green-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
              >
                {POST_TYPES[k].label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Categoría</p>
          <div className="flex gap-2">
            {(Object.keys(POST_CATEGORIES) as PostCategory[]).map((k) => (
              <Chip key={k} active={filter === k} onClick={() => setFilter(k)}>{POST_CATEGORIES[k]}</Chip>
            ))}
          </div>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          maxLength={400}
          placeholder={type === 'busco-companeros' ? 'Ej: Busco compañeros para estudiar Microeconomía los jueves…' : 'Cuéntale a la comunidad tu idea…'}
          className={cn(input, 'resize-none')}
        />
        {type === 'plan' && (
          <div className="grid grid-cols-2 gap-2">
            <input value={when} maxLength={80} onChange={(e) => setWhen(e.target.value)} placeholder="¿Cuándo?" className={input} />
            <input value={where} maxLength={80} onChange={(e) => setWhere(e.target.value)} placeholder="¿Dónde?" className={input} />
          </div>
        )}
        <p className="text-xs text-slate-400">Recuerda: respeto ante todo. Las publicaciones ofensivas pueden ser denunciadas.</p>
        <motion.button whileTap={{ scale: 0.97 }} disabled={!text.trim() || sending} className="w-full rounded-2xl bg-green-700 py-3.5 font-semibold text-white shadow-sm hover:bg-green-800 disabled:bg-slate-200 disabled:text-slate-400">
          {sending ? 'Publicando…' : 'Publicar'}
        </motion.button>
      </form>
    </Sheet>
  )
}
