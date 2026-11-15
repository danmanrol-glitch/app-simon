import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Ban, CalendarDays, Flag, MapPin, MessageCircle, MoreHorizontal, Send, SmilePlus, Users } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { CURRENT_USER_ID, getUser, POST_TYPES, REACTIONS, type Post, type ReactionType } from '../mock/db'
import { Avatar } from './Avatar'
import { cn, timeAgo } from '../lib'

export function PostCard({ post }: { post: Post }) {
  const { myReactions, react, addComment, reportPost, blockAuthor, reportedPostIds } = useApp()
  const author = getUser(post.authorId)
  const mine = myReactions[post.id]
  const [showComments, setShowComments] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [menu, setMenu] = useState(false)
  const [draft, setDraft] = useState('')
  const total = Object.values(post.reactions).reduce((a, b) => a + b, 0)
  const top = (Object.entries(post.reactions) as [ReactionType, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const isMine = post.authorId === CURRENT_USER_ID

  if (reportedPostIds.has(post.id)) {
    return (
      <motion.div layout className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-5 text-center text-sm text-slate-500">
        Denunciaste esta publicación. La ocultamos mientras se revisa.
      </motion.div>
    )
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim()) return
    addComment(post.id, draft.trim())
    setDraft('')
  }

  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar userId={author.id} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{author.name}</p>
          <p className="truncate text-xs text-slate-500">{author.career} · {author.semester}.º sem · {timeAgo(post.createdAt)}</p>
        </div>
        {!isMine && (
          <div className="relative">
            <button onClick={() => setMenu((m) => !m)} aria-label="Más opciones" className="rounded-full p-2 text-slate-400 hover:bg-slate-100">
              <MoreHorizontal size={18} />
            </button>
            <AnimatePresence>
              {menu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute right-0 top-10 z-20 w-48 overflow-hidden rounded-2xl bg-white py-1 shadow-lg ring-1 ring-slate-100"
                >
                  <button onClick={() => { setMenu(false); reportPost(post.id) }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                    <Flag size={16} /> Denunciar publicación
                  </button>
                  <button onClick={() => { setMenu(false); blockAuthor(post.authorId) }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                    <Ban size={16} /> Bloquear a {author.nickname}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <span className={cn('mt-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold', POST_TYPES[post.type].color)}>
        {POST_TYPES[post.type].label}
      </span>
      <p className="mt-2 text-[15px] leading-relaxed text-slate-700">{post.text}</p>

      {post.planDetails && (
        <div className="mt-3 space-y-1.5 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          {post.planDetails.when && <p className="flex items-center gap-2"><CalendarDays size={15} className="text-green-700" />{post.planDetails.when}</p>}
          {post.planDetails.where && <p className="flex items-center gap-2"><MapPin size={15} className="text-green-700" />{post.planDetails.where}</p>}
          {post.planDetails.spots && <p className="flex items-center gap-2"><Users size={15} className="text-green-700" />{post.planDetails.spots} cupos</p>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          {top.map(([r]) => <span key={r}>{REACTIONS[r]}</span>)}
          {total > 0 && <span className="ml-1">{total}</span>}
        </span>
        <button onClick={() => setShowComments((s) => !s)} className="hover:text-slate-700">
          {post.comments.length} comentarios
        </button>
      </div>

      <div className="relative mt-3 flex gap-2 border-t border-slate-100 pt-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => react(post.id, mine ?? 'like')}
          className={cn('flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-medium transition-colors', mine ? 'bg-green-50 text-green-700' : 'text-slate-600 hover:bg-slate-50')}
        >
          <span className="text-base leading-none">{REACTIONS[mine ?? 'like']}</span> {mine ? 'Reaccionaste' : 'Me gusta'}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowPicker((s) => !s)} aria-label="Elegir reacción" className="rounded-2xl px-3 text-slate-500 hover:bg-slate-50">
          <SmilePlus size={18} />
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowComments((s) => !s)}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          <MessageCircle size={17} /> Comentar
        </motion.button>
        <AnimatePresence>
          {showPicker && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.9 }}
              className="absolute -top-12 left-0 z-10 flex gap-1 rounded-full bg-white px-2 py-1.5 shadow-lg ring-1 ring-slate-100"
            >
              {(Object.keys(REACTIONS) as ReactionType[]).map((r) => (
                <motion.button
                  key={r}
                  whileHover={{ scale: 1.3, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => { react(post.id, r); setShowPicker(false) }}
                  className={cn('rounded-full p-1 text-xl', mine === r && 'bg-green-50')}
                  aria-label={r}
                >
                  {REACTIONS[r]}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence initial={false}>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="space-y-3 pt-4">
              {post.comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar userId={c.authorId} size="sm" />
                  <div className="rounded-2xl rounded-tl-md bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800">{getUser(c.authorId).name}</p>
                    <p className="text-sm text-slate-700">{c.text}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={submit} className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe un comentario…"
                  className="flex-1 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-green-600/30 focus:ring-2"
                />
                <motion.button whileTap={{ scale: 0.9 }} disabled={!draft.trim()} aria-label="Enviar" className="grid h-10 w-10 place-items-center rounded-2xl bg-green-700 text-white disabled:bg-slate-200">
                  <Send size={16} />
                </motion.button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  )
}
