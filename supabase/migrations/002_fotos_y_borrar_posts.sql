-- ════════════════════════════════════════════════════════════════════
-- EAN Connect · Migración 002: fotos en publicaciones y borrar posts
-- Ejecútala en Supabase > SQL Editor > New query > Run.
-- Es idempotente: puedes volver a ejecutarla sin problema.
-- ════════════════════════════════════════════════════════════════════

-- 1. Columna para la foto de cada publicación (ruta dentro del bucket).
alter table public.posts add column if not exists image_path text
  check (image_path is null or char_length(image_path) <= 200);

-- 2. Bucket público para las fotos: máximo 5 MB, solo JPG, PNG o WebP.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 3. Cada estudiante solo sube y borra fotos dentro de su carpeta (<su id>/archivo.jpg).
drop policy if exists "post-images: subir en mi carpeta" on storage.objects;
create policy "post-images: subir en mi carpeta" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "post-images: borrar las mías" on storage.objects;
create policy "post-images: borrar las mías" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-images' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- 4. Una publicación solo puede apuntar a una foto de la carpeta de su autor.
alter table public.posts drop constraint if exists posts_image_path_owner;
alter table public.posts add constraint posts_image_path_owner
  check (image_path is null or split_part(image_path, '/', 1) = author_id::text);

-- Borrar publicaciones ya estaba permitido para su autor (política "posts: borrar los míos"
-- en schema.sql); al borrar un post se borran en cascada sus comentarios y reacciones.
