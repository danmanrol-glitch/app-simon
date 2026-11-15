-- ════════════════════════════════════════════════════════════════════
-- EAN Connect · Esquema de base de datos para Supabase
-- Ejecuta este archivo completo en: Supabase > SQL Editor > New query > Run
-- Es idempotente: puedes volver a ejecutarlo sin perder datos.
-- ════════════════════════════════════════════════════════════════════

-- ─────────────────────────── Perfiles ───────────────────────────
create table if not exists public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  full_name           text not null default '',
  nickname            text not null default '',
  career              text not null default '',
  semester            smallint not null default 1 check (semester between 1 and 12),
  bio                 text not null default '' check (char_length(bio) <= 300),
  interests           text[] not null default '{}',
  favorite_activities text[] not null default '{}',
  privacy             jsonb not null default '{"showCareer":true,"showSemester":true,"showInterests":true,"showActivities":true,"profileVisibleTo":"todos"}',
  notifications       jsonb not null default '{"newActivities":true,"communityReplies":true,"reminders":true,"wellbeingSurveys":true}',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Crea el perfil automáticamente cuando alguien se registra (usa los datos del formulario de registro).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  sem smallint;
begin
  begin
    sem := coalesce(nullif(new.raw_user_meta_data ->> 'semester', '')::smallint, 1);
  exception when others then
    sem := 1;
  end;
  insert into public.profiles (id, full_name, nickname, career, semester)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 80),
    left(coalesce(nullif(new.raw_user_meta_data ->> 'nickname', ''), split_part(new.email, '@', 1)), 30),
    left(coalesce(new.raw_user_meta_data ->> 'career', ''), 80),
    least(greatest(sem, 1), 12)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;

-- Cada estudiante solo lee y edita su propio perfil completo.
drop policy if exists "profiles: leer el propio" on public.profiles;
create policy "profiles: leer el propio" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles: editar el propio" on public.profiles;
create policy "profiles: editar el propio" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Vista pública: lo que otros estudiantes pueden ver, según la configuración de privacidad.
-- Corre con los permisos de su dueño para poder leer todos los perfiles, pero solo expone columnas filtradas.
create or replace view public.public_profiles as
select
  p.id,
  p.full_name,
  p.nickname,
  case when (p.privacy ->> 'profileVisibleTo') = 'nadie' or not coalesce((p.privacy ->> 'showCareer')::boolean, true) then null else p.career end as career,
  case when (p.privacy ->> 'profileVisibleTo') = 'nadie' or not coalesce((p.privacy ->> 'showSemester')::boolean, true) then null else p.semester end as semester,
  case when (p.privacy ->> 'profileVisibleTo') = 'nadie' or not coalesce((p.privacy ->> 'showInterests')::boolean, true) then null else p.interests end as interests
from public.profiles p;

revoke all on public.public_profiles from anon, public;
grant select on public.public_profiles to authenticated;

-- ─────────────────────────── Actividades ───────────────────────────
create table if not exists public.activities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  category    text not null check (category in ('deportes','arte-cultura','emprendimiento','juegos','voluntariado','grupos-estudio')),
  description text not null default '',
  date        date not null,
  start_time  time not null,
  end_time    time not null,
  location    text not null,
  total_spots integer not null check (total_spots > 0),
  organizer   text not null default '',
  tags        text[] not null default '{}',
  created_at  timestamptz not null default now()
);

alter table public.activities enable row level security;

-- Los estudiantes solo leen actividades. Se crean desde el panel de Supabase (Table Editor).
drop policy if exists "activities: leer" on public.activities;
create policy "activities: leer" on public.activities
  for select to authenticated using (true);

-- ─────────────────────────── Inscripciones ───────────────────────────
create table if not exists public.enrollments (
  activity_id uuid not null references public.activities (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (activity_id, user_id)
);

create index if not exists enrollments_user_idx on public.enrollments (user_id);

-- Impide inscripciones cuando no hay cupos (bloquea la fila de la actividad para evitar sobrecupo).
create or replace function public.check_activity_capacity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  capacity integer;
  taken integer;
begin
  select total_spots into capacity from public.activities where id = new.activity_id for update;
  if capacity is null then
    raise exception 'La actividad no existe';
  end if;
  select count(*) into taken from public.enrollments where activity_id = new.activity_id;
  if taken >= capacity then
    raise exception 'ACTIVITY_FULL' using hint = 'La actividad ya no tiene cupos';
  end if;
  return new;
end;
$$;

drop trigger if exists enrollments_check_capacity on public.enrollments;
create trigger enrollments_check_capacity
  before insert on public.enrollments
  for each row execute function public.check_activity_capacity();

alter table public.enrollments enable row level security;

drop policy if exists "enrollments: leer" on public.enrollments;
create policy "enrollments: leer" on public.enrollments
  for select to authenticated using (true);

drop policy if exists "enrollments: inscribirme" on public.enrollments;
create policy "enrollments: inscribirme" on public.enrollments
  for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "enrollments: cancelar la mía" on public.enrollments;
create policy "enrollments: cancelar la mía" on public.enrollments
  for delete to authenticated using ((select auth.uid()) = user_id);

-- ─────────────────────────── Comunidad ───────────────────────────
create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  type       text not null check (type in ('plan','busco-companeros','general')),
  category   text not null check (category in ('deportes','academico','recreativo')),
  text       text not null check (char_length(text) between 1 and 400),
  plan_when  text check (char_length(plan_when) <= 80),
  plan_where text check (char_length(plan_where) <= 80),
  plan_spots integer check (plan_spots > 0),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists posts_created_idx on public.posts (created_at desc);

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  author_id  uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  text       text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);

create index if not exists comments_post_idx on public.comments (post_id, created_at);

create table if not exists public.post_reactions (
  post_id    uuid not null references public.posts (id) on delete cascade,
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reaction   text not null check (reaction in ('like','love','fun','support')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.post_reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.posts (id) on delete cascade,
  reporter_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  reason      text not null default '',
  created_at  timestamptz not null default now(),
  unique (post_id, reporter_id)
);

create table if not exists public.user_blocks (
  blocker_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.posts          enable row level security;
alter table public.comments       enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_reports   enable row level security;
alter table public.user_blocks    enable row level security;

-- Posts
drop policy if exists "posts: leer" on public.posts;
create policy "posts: leer" on public.posts
  for select to authenticated using (true);
-- Los posts se crean solo desde /api/publish (moderación con IA + secret key). Ver migración 003.
drop policy if exists "posts: publicar" on public.posts;
drop policy if exists "posts: borrar los míos" on public.posts;
create policy "posts: borrar los míos" on public.posts
  for delete to authenticated using ((select auth.uid()) = author_id);

-- Comentarios
drop policy if exists "comments: leer" on public.comments;
create policy "comments: leer" on public.comments
  for select to authenticated using (true);
-- Los comentarios se crean solo desde /api/publish (moderación con IA + secret key). Ver migración 003.
drop policy if exists "comments: comentar" on public.comments;
drop policy if exists "comments: borrar los míos" on public.comments;
create policy "comments: borrar los míos" on public.comments
  for delete to authenticated using ((select auth.uid()) = author_id);

-- Reacciones (una por persona y post)
drop policy if exists "reactions: leer" on public.post_reactions;
create policy "reactions: leer" on public.post_reactions
  for select to authenticated using (true);
drop policy if exists "reactions: reaccionar" on public.post_reactions;
create policy "reactions: reaccionar" on public.post_reactions
  for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "reactions: cambiar la mía" on public.post_reactions;
create policy "reactions: cambiar la mía" on public.post_reactions
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
drop policy if exists "reactions: quitar la mía" on public.post_reactions;
create policy "reactions: quitar la mía" on public.post_reactions
  for delete to authenticated using ((select auth.uid()) = user_id);

-- Denuncias: cada quien crea y ve solo las suyas. El equipo las revisa desde el panel.
drop policy if exists "reports: denunciar" on public.post_reports;
create policy "reports: denunciar" on public.post_reports
  for insert to authenticated with check ((select auth.uid()) = reporter_id);
drop policy if exists "reports: ver las mías" on public.post_reports;
create policy "reports: ver las mías" on public.post_reports
  for select to authenticated using ((select auth.uid()) = reporter_id);

-- Bloqueos: privados de cada usuario.
drop policy if exists "blocks: ver los míos" on public.user_blocks;
create policy "blocks: ver los míos" on public.user_blocks
  for select to authenticated using ((select auth.uid()) = blocker_id);
drop policy if exists "blocks: bloquear" on public.user_blocks;
create policy "blocks: bloquear" on public.user_blocks
  for insert to authenticated with check ((select auth.uid()) = blocker_id);
drop policy if exists "blocks: desbloquear" on public.user_blocks;
create policy "blocks: desbloquear" on public.user_blocks
  for delete to authenticated using ((select auth.uid()) = blocker_id);

-- ─────────────────────────── Datos iniciales (opcional) ───────────────────────────
-- Actividades de ejemplo para probar la app. Bórralas o edítalas en Table Editor cuando cargues las reales.
insert into public.activities (name, category, description, date, start_time, end_time, location, total_spots, organizer, tags)
select * from (values
  ('Torneo relámpago de fútbol 5', 'deportes', 'Arma tu equipo o inscríbete solo y te asignamos uno. Partidos de 15 minutos, buena energía y premios para los tres primeros.', date '2026-11-25', time '14:00', time '17:00', 'Cancha sintética – Sede El Nogal', 40, 'Bienestar Universitario', array['Fútbol']),
  ('Taller de fotografía con celular', 'arte-cultura', 'Aprende composición, luz y edición básica usando solo tu celular. Terminamos con una salida fotográfica por el barrio.', date '2026-11-26', time '10:00', time '12:00', 'Sala creativa, piso 3 – Sede Legacy', 20, 'Club de Arte EAN', array['Fotografía']),
  ('Pitch Night: valida tu idea', 'emprendimiento', 'Presenta tu idea de negocio en 3 minutos y recibe feedback de mentores y emprendedores egresados. No necesitas tener nada construido.', date '2026-11-27', time '18:00', time '20:30', 'Auditorio principal – Sede El Nogal', 80, 'Centro de Emprendimiento', array['Startups','Finanzas']),
  ('Noche de juegos de mesa', 'juegos', 'Catan, Uno, Dixit y más. Ideal para conocer gente sin presión: llegas, te sientas en una mesa y juegas.', date '2026-11-28', time '16:00', time '19:00', 'Zona de bienestar, piso 2 – Sede Legacy', 30, 'Gamers EAN', array['Videojuegos','Ajedrez']),
  ('Siembra de árboles en los cerros', 'voluntariado', 'Jornada de reforestación con una fundación aliada. Incluye transporte desde la universidad y refrigerio. Usa ropa cómoda.', date '2026-11-29', time '07:00', time '13:00', 'Punto de encuentro: entrada principal – Sede El Nogal', 25, 'Voluntariado EAN', array['Voluntariado']),
  ('Grupo de estudio: Cálculo diferencial', 'grupos-estudio', 'Repaso para el parcial final con monitores. Trae tus dudas y ejercicios; trabajamos en mesas pequeñas.', date '2026-12-01', time '12:00', time '14:00', 'Biblioteca, sala 4 – Sede El Nogal', 15, 'Monitorías académicas', array['Finanzas']),
  ('Running club al amanecer', 'deportes', '5 km a ritmo suave, todos los niveles. Terminamos con estiramientos y café.', date '2026-12-02', time '06:30', time '07:45', 'Parque El Virrey (salida desde la Sede El Nogal)', 35, 'Running EAN', array['Running']),
  ('Intercambio de idiomas: English & Coffee', 'arte-cultura', 'Conversación en inglés en mesas temáticas, guiada por estudiantes de Lenguas Modernas. Todos los niveles bienvenidos.', date '2026-12-03', time '15:00', time '16:30', 'Cafetería – Sede Legacy', 24, 'Club de Idiomas', array['Idiomas','Música'])
) as seed (name, category, description, date, start_time, end_time, location, total_spots, organizer, tags)
where not exists (select 1 from public.activities);

-- ─────────────────────────── Fotos de publicaciones ───────────────────────────
-- (también en supabase/migrations/002_fotos_y_borrar_posts.sql para proyectos ya creados)
alter table public.posts add column if not exists image_path text
  check (image_path is null or char_length(image_path) <= 200);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "post-images: subir en mi carpeta" on storage.objects;
create policy "post-images: subir en mi carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "post-images: borrar las mías" on storage.objects;
create policy "post-images: borrar las mías" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

alter table public.posts drop constraint if exists posts_image_path_owner;
alter table public.posts add constraint posts_image_path_owner
  check (image_path is null or split_part(image_path, '/', 1) = author_id::text);

-- ─────────────────────────── Moderación con IA ───────────────────────────
-- (también en supabase/migrations/003_moderacion_ia.sql para proyectos ya creados)
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
