import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Ban, CalendarDays, Flag, MapPin, MessageCircle, MoreHorizontal, Send, SmilePlus, Trash2, Users } from 'lucide-react'
import { POST_TYPES, REACTIONS } from '../data/catalog'
import type { Post, PublicProfile, ReactionType } from '../types'
import { Avatar } from './Avatar'
import { cn, timeAgo } from '../lib/utils'
import { postImageUrl } from '../lib/image'

interface Props {
  post: Post
  currentUserId: string
  profiles: Map<string, PublicProfile>
  blockedIds: Set<string>
  reported: boolean
  onReact: (postId: string, reaction: ReactionType) => void
  onComment: (postId: string, text: string) => Promise<boolean>
  onReport: (postId: string) => void
  onBlock: (authorId: string) => void
  onDelete: (postId: string) => Promise<void>
}

const nameOf = (profiles: Map<string, PublicProfile>, id: string) => {
  const p = profiles.get(id)
  return { id, name: p?.full_name || p?.nickname || 'Estudiante EAN', nickname: p?.nickname || 'estudiante', career: p?.career, semester: p?.semester }
}

export function PostCard({ post, currentUserId, profiles, blockedIds, reported, onReact, onComment, onReport, onBlock, onDelete }: Props) {
  const author = nameOf(profiles, post.author_id)
  const mine = post.my_reaction ?? undefined
  const [showComments, setShowComments] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [menu, setMenu] = useState(false)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const total = Object.values(post.reactions).reduce((a, b) => a + b, 0)
  const top = (Object.entries(post.reactions) as [ReactionType, number][]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).slice(0, 3)
  const isMine = post.author_id === currentUserId
  const comments = post.comments.filter((c) => !blockedIds.has(c.author_id))

  if (reported) {
    return (
      <motion.div layout className="rounded-3xl border border-dashed border-slate-200 bg-white/60 p-5 text-center text-sm text-slate-500">
        Denunciaste esta publicación. La ocultamos mientras se revisa.
      </motion.div>
    )
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!draft.trim() || sending) return
    setSending(true)
    const ok = await onComment(post.id, draft.trim())
    setSending(false)
    if (ok) setDraft('')
  }

  return (
    <motion.article layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} className="rounded-3xl bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <Avatar person={author} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-slate-900">{author.name}</p>
          <p className="truncate text-xs text-slate-500">{[author.career, author.semester && `${author.semester}.º sem`, timeAgo(post.created_at)].filter(Boolean).join(' · ')}</p>
        </div>
        {(
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
                  {isMine ? (
                    <button
                      disabled={deleting}
                      onClick={async () => {
                        setMenu(false)
                        if (!window.confirm('¿Eliminar esta publicación? También se borran sus comentarios y reacciones.')) return
                        setDeleting(true)
                        await onDelete(post.id)
                        setDeleting(false)
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <Trash2 size={16} /> Eliminar publicación
                    </button>
                  ) : (
                    <>
                      <button onClick={() => { setMenu(false); onReport(post.id) }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50">
                        <Flag size={16} /> Denunciar publicación
                      </button>
                      <button onClick={() => { setMenu(false); onBlock(post.author_id) }} className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-rose-600 hover:bg-rose-50">
                        <Ban size={16} /> Bloquear a {author.nickname}
                      </button>
                    </>
                  )}
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

      {post.image_path && (
        <>
          <button type="button" onClick={() => setImageOpen(true)} className="mt-3 block w-full overflow-hidden rounded-2xl bg-slate-100" aria-label="Ver foto completa">
            <img src={postImageUrl(post.image_path)} alt="Foto de la publicación" loading="lazy" className="max-h-96 w-full object-cover" />
          </button>
          <AnimatePresence>
            {imageOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setImageOpen(false)}
                className="fixed inset-0 z-50 grid place-items-center bg-slate-950/90 p-4"
                role="dialog"
                aria-label="Foto completa"
              >
                <img src={postImageUrl(post.image_path)} alt="Foto de la publicación" className="max-h-full max-w-full rounded-xl object-contain" />
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {(post.plan_when || post.plan_where || post.plan_spots) && (
        <div className="mt-3 space-y-1.5 rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
          {post.plan_when && <p className="flex items-center gap-2"><CalendarDays size={15} className="text-green-700" />{post.plan_when}</p>}
          {post.plan_where && <p className="flex items-center gap-2"><MapPin size={15} className="text-green-700" />{post.plan_where}</p>}
          {post.plan_spots && <p className="flex items-center gap-2"><Users size={15} className="text-green-700" />{post.plan_spots} cupos</p>}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          {top.map(([r]) => <span key={r}>{REACTIONS[r]}</span>)}
          {total > 0 && <span className="ml-1">{total}</span>}
        </span>
        <button onClick={() => setShowComments((s) => !s)} className="hover:text-slate-700">
          {comments.length} comentarios
        </button>
      </div>

      <div className="relative mt-3 flex gap-2 border-t border-slate-100 pt-3">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => onReact(post.id, mine ?? 'like')}
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
                  onClick={() => { onReact(post.id, r); setShowPicker(false) }}
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
              {comments.map((c) => (
                <div key={c.id} className="flex gap-2">
                  <Avatar person={nameOf(profiles, c.author_id)} size="sm" />
                  <div className="rounded-2xl rounded-tl-md bg-slate-50 px-3 py-2">
                    <p className="text-xs font-semibold text-slate-800">{nameOf(profiles, c.author_id).name}</p>
                    <p className="text-sm text-slate-700">{c.text}</p>
                  </div>
                </div>
              ))}
              <form onSubmit={submit} className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Escribe un comentario…"
                  maxLength={300}
                  className="flex-1 rounded-2xl bg-slate-50 px-4 py-2.5 text-sm outline-none ring-green-600/30 focus:ring-2"
                />
                <motion.button whileTap={{ scale: 0.9 }} disabled={!draft.trim() || sending} aria-label="Enviar" className="grid h-10 w-10 place-items-center rounded-2xl bg-green-700 text-white disabled:bg-slate-200">
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
