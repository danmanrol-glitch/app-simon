-- ════════════════════════════════════════════════════════════════════
-- EAN Connect · Migración 003: moderación con IA
-- Ejecútala DESPUÉS de la 002, en Supabase > SQL Editor > New query > Run.
-- Es idempotente: puedes volver a ejecutarla sin problema.
-- ════════════════════════════════════════════════════════════════════

-- 1. Resultado de la moderación en cada post y comentario.
--    approved = la IA lo aprobó · review = publicado, pero un administrador debe revisarlo.
alter table public.posts    add column if not exists moderation_status text not null default 'approved';
alter table public.posts    add column if not exists moderation_categories text[] not null default '{}';
alter table public.comments add column if not exists moderation_status text not null default 'approved';
alter table public.comments add column if not exists moderation_categories text[] not null default '{}';

alter table public.posts    drop constraint if exists posts_moderation_status_check;
alter table public.posts    add constraint posts_moderation_status_check check (moderation_status in ('approved', 'review'));
alter table public.comments drop constraint if exists comments_moderation_status_check;
alter table public.comments add constraint comments_moderation_status_check check (moderation_status in ('approved', 'review'));

create index if not exists posts_review_idx    on public.posts (created_at desc)    where moderation_status = 'review';
create index if not exists comments_review_idx on public.comments (created_at desc) where moderation_status = 'review';

-- 2. Los estudiantes ya no insertan posts ni comentarios directamente: solo la función
--    /api/publish (Vercel), que usa la secret key después de revisar el contenido con IA.
--    Borrar lo propio, reaccionar, denunciar y bloquear siguen funcionando igual.
drop policy if exists "posts: publicar" on public.posts;
drop policy if exists "comments: comentar" on public.comments;

-- 3. Vista para administradores: lo publicado que la IA marcó para revisión.
--    Consúltala en SQL Editor:  select * from public.moderation_queue;
create or replace view public.moderation_queue as
select 'post' as kind, p.id, p.author_id, p.text, p.image_path, p.moderation_categories, p.created_at
from public.posts p where p.moderation_status = 'review'
union all
select 'comment', c.id, c.author_id, c.text, null, c.moderation_categories, c.created_at
from public.comments c where c.moderation_status = 'review'
order by created_at desc;

revoke all on public.moderation_queue from anon, authenticated, public;
