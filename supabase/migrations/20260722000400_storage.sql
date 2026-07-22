-- ==========================================================================
-- IRTS / NDA ACADEMY — Storage buckets & policies
-- ==========================================================================

insert into storage.buckets (id, name, public)
values
  ('avatars',        'avatars',        true),
  ('public-assets',  'public-assets',  true),   -- logo, capas de site
  ('course-covers',  'course-covers',  true),
  ('course-videos',  'course-videos',  false),  -- privado → URLs assinadas
  ('library',        'library',        false),  -- privado → URLs assinadas
  ('certificates',   'certificates',   false)
on conflict (id) do nothing;

-- Leitura pública dos buckets públicos
create policy "public_read_buckets" on storage.objects
  for select using (bucket_id in ('avatars','public-assets','course-covers'));

-- Avatar: usuário grava no próprio "namespace" (pasta = uid)
create policy "avatar_write_own" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "avatar_update_own" on storage.objects
  for update to authenticated using (
    bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Admin gerencia todo o storage (upload de cursos, biblioteca, etc.)
create policy "storage_admin_all" on storage.objects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Buckets privados (course-videos, library, certificates):
-- acesso apenas via URLs assinadas geradas no servidor (service_role),
-- que valida `has_course_access` / propriedade antes de assinar.
