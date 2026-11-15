import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { compressImage, POST_IMAGES_BUCKET } from '../lib/image'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import type { Comment, Post, PostCategory, PostType, ReactionType } from '../types'

const EMPTY_REACTIONS: Record<ReactionType, number> = { like: 0, love: 0, fun: 0, support: 0 }

type PostRow = Omit<Post, 'comments' | 'reactions' | 'my_reaction'> & {
  comments: Comment[]
  post_reactions: { user_id: string; reaction: ReactionType }[]
}

export interface NewPostInput {
  type: PostType
  category: PostCategory
  text: string
  planWhen?: string
  planWhere?: string
  image?: File | null
}

export function useCommunity() {
  const { session } = useAuth()
  const { showToast } = useToast()
  const userId = session?.user.id
  const [posts, setPosts] = useState<Post[]>([])
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set())
  const [reportedIds, setReportedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!userId) return
    setError(null)
    const [postsRes, blocksRes, reportsRes] = await Promise.all([
      supabase
        .from('posts')
        .select('id, author_id, type, category, text, plan_when, plan_where, plan_spots, image_path, created_at, comments(id, post_id, author_id, text, created_at), post_reactions(user_id, reaction)')
        .order('created_at', { ascending: false })
        .order('created_at', { referencedTable: 'comments', ascending: true })
        .limit(50),
      supabase.from('user_blocks').select('blocked_id'),
      supabase.from('post_reports').select('post_id'),
    ])
    if (postsRes.error) {
      console.error(postsRes.error)
      setError('No pudimos cargar la comunidad.')
      setLoading(false)
      return
    }
    setPosts(
      (postsRes.data as unknown as PostRow[]).map(({ post_reactions, ...p }) => {
        const reactions = { ...EMPTY_REACTIONS }
        post_reactions.forEach((r) => (reactions[r.reaction] += 1))
        return { ...p, reactions, my_reaction: post_reactions.find((r) => r.user_id === userId)?.reaction ?? null }
      }),
    )
    setBlockedIds(new Set((blocksRes.data ?? []).map((b: { blocked_id: string }) => b.blocked_id)))
    setReportedIds(new Set((reportsRes.data ?? []).map((r: { post_id: string }) => r.post_id)))
    setLoading(false)
  }, [userId])

  useEffect(() => {
    void load()
  }, [load])

  const addPost = async ({ type, category, text, planWhen, planWhere, image }: NewPostInput) => {
    if (!userId) return false

    let imagePath: string | null = null
    if (image) {
      try {
        const blob = await compressImage(image)
        imagePath = `${userId}/${crypto.randomUUID()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from(POST_IMAGES_BUCKET)
          .upload(imagePath, blob, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: false })
        if (uploadError) {
          console.error(uploadError)
          showToast('No se pudo subir la foto. Intenta de nuevo.')
          return false
        }
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'No se pudo procesar la foto.')
        return false
      }
    }

    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id: userId,
        type,
        category,
        text,
        plan_when: type === 'plan' && planWhen ? planWhen : null,
        plan_where: type === 'plan' && planWhere ? planWhere : null,
        image_path: imagePath,
      })
      .select('id, author_id, type, category, text, plan_when, plan_where, plan_spots, image_path, created_at')
      .single()
    if (error) {
      if (imagePath) void supabase.storage.from(POST_IMAGES_BUCKET).remove([imagePath])
      showToast('No se pudo publicar. Intenta de nuevo.')
      return false
    }
    setPosts((prev) => [{ ...(data as Omit<Post, 'comments' | 'reactions' | 'my_reaction'>), comments: [], reactions: { ...EMPTY_REACTIONS }, my_reaction: null }, ...prev])
    showToast('Publicación creada')
    return true
  }

  const deletePost = async (postId: string) => {
    if (!userId) return
    const post = posts.find((p) => p.id === postId)
    if (!post || post.author_id !== userId) return
    const { data, error } = await supabase.from('posts').delete().eq('id', postId).select('id')
    if (error || !data?.length) {
      showToast('No se pudo eliminar la publicación.')
      return
    }
    if (post.image_path) void supabase.storage.from(POST_IMAGES_BUCKET).remove([post.image_path])
    setPosts((prev) => prev.filter((p) => p.id !== postId))
    showToast('Publicación eliminada')
  }

  const react = async (postId: string, reaction: ReactionType) => {
    if (!userId) return
    const post = posts.find((p) => p.id === postId)
    if (!post) return
    const previous = post.my_reaction
    const next = previous === reaction ? null : reaction

    const applyReaction = (from: ReactionType | null, to: ReactionType | null) =>
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p
          const r = { ...p.reactions }
          if (from) r[from] -= 1
          if (to) r[to] += 1
          return { ...p, reactions: r, my_reaction: to }
        }),
      )

    applyReaction(previous, next)
    const { error } = next
      ? await supabase.from('post_reactions').upsert({ post_id: postId, user_id: userId, reaction: next }, { onConflict: 'post_id,user_id' })
      : await supabase.from('post_reactions').delete().match({ post_id: postId, user_id: userId })
    if (error) {
      applyReaction(next, previous)
      showToast('No se pudo guardar tu reacción.')
    }
  }

  const addComment = async (postId: string, text: string) => {
    if (!userId) return false
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, author_id: userId, text })
      .select('id, post_id, author_id, text, created_at')
      .single()
    if (error) {
      showToast('No se pudo enviar el comentario.')
      return false
    }
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, data as Comment] } : p)))
    return true
  }

  const reportPost = async (postId: string) => {
    if (!userId) return
    const { error } = await supabase.from('post_reports').insert({ post_id: postId, reporter_id: userId })
    if (error && error.code !== '23505') {
      showToast('No se pudo enviar la denuncia.')
      return
    }
    setReportedIds((prev) => new Set(prev).add(postId))
    showToast('Gracias. Nuestro equipo revisará la publicación.')
  }

  const blockAuthor = async (authorId: string) => {
    if (!userId) return
    const { error } = await supabase.from('user_blocks').insert({ blocker_id: userId, blocked_id: authorId })
    if (error && error.code !== '23505') {
      showToast('No se pudo bloquear al usuario.')
      return
    }
    setBlockedIds((prev) => new Set(prev).add(authorId))
    showToast('Usuario bloqueado. Ya no verás sus publicaciones.')
  }

  return { posts, blockedIds, reportedIds, loading, error, reload: load, addPost, deletePost, react, addComment, reportPost, blockAuthor }
}
