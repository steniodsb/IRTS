-- ==========================================================================
-- IRTS / NDA ACADEMY — Row Level Security
-- Nota: a service_role (edge functions / webhooks / admin server) ignora RLS.
-- ==========================================================================

-- Habilita RLS em todas as tabelas do schema public
do $$
declare t text;
begin
  for t in
    select tablename from pg_tables where schemaname='public'
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- PROFILES
-- --------------------------------------------------------------------------
create policy "profiles_select_authenticated" on public.profiles
  for select to authenticated using (true);            -- necessário p/ comunidade
create policy "profiles_update_own" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- PLANS (catálogo público)
-- --------------------------------------------------------------------------
create policy "plans_public_read" on public.plans
  for select using (active = true);
create policy "plans_admin_all" on public.plans
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- SUBSCRIPTIONS
-- --------------------------------------------------------------------------
create policy "subs_select_own" on public.subscriptions
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "subs_admin_all" on public.subscriptions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- COURSES / MODULES / LESSONS
-- --------------------------------------------------------------------------
create policy "courses_public_read" on public.courses
  for select using (published = true or public.is_admin());
create policy "courses_admin_all" on public.courses
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "modules_read" on public.modules
  for select using (
    exists(select 1 from public.courses c where c.id = course_id and (c.published or public.is_admin()))
  );
create policy "modules_admin_all" on public.modules
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Aulas: amostra pública, ou com acesso ao curso, ou admin.
create policy "lessons_read_access" on public.lessons
  for select using (
    is_preview = true
    or public.has_course_access(auth.uid(), course_id)
    or public.is_admin()
  );
create policy "lessons_admin_all" on public.lessons
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- ENROLLMENTS / PROGRESS / CERTIFICATES
-- --------------------------------------------------------------------------
create policy "enroll_select_own" on public.enrollments
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "enroll_insert_free" on public.enrollments      -- auto-matrícula em curso grátis
  for insert to authenticated with check (
    user_id = auth.uid()
    and exists(select 1 from public.courses c where c.id = course_id and c.is_free = true)
  );
create policy "enroll_admin_all" on public.enrollments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "progress_own" on public.lesson_progress
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "cert_select_own" on public.certificates
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- --------------------------------------------------------------------------
-- BIBLIOTECA
-- --------------------------------------------------------------------------
create policy "library_public_read" on public.library_items
  for select using (published = true or public.is_admin());
create policy "library_admin_all" on public.library_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "downloads_own" on public.downloads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- AGENDA
-- --------------------------------------------------------------------------
create policy "events_public_read" on public.events
  for select using (published = true or public.is_admin());
create policy "events_admin_all" on public.events
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "event_reg_own" on public.event_registrations
  for all to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid());

-- --------------------------------------------------------------------------
-- COMUNIDADE
-- --------------------------------------------------------------------------
create policy "forum_cat_read" on public.forum_categories for select using (true);
create policy "forum_cat_admin" on public.forum_categories
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "threads_read" on public.forum_threads
  for select to authenticated using (true);
create policy "threads_insert_own" on public.forum_threads
  for insert to authenticated with check (user_id = auth.uid());
create policy "threads_update_own" on public.forum_threads
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "threads_delete_own" on public.forum_threads
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

create policy "posts_read" on public.forum_posts
  for select to authenticated using (true);
create policy "posts_insert_own" on public.forum_posts
  for insert to authenticated with check (user_id = auth.uid());
create policy "posts_modify_own" on public.forum_posts
  for update to authenticated using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());
create policy "posts_delete_own" on public.forum_posts
  for delete to authenticated using (user_id = auth.uid() or public.is_admin());

-- --------------------------------------------------------------------------
-- CONTEÚDO INÍCIO (news / announcements / updates)
-- --------------------------------------------------------------------------
create policy "news_public_read" on public.news for select using (published = true or public.is_admin());
create policy "news_admin" on public.news for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "ann_public_read" on public.announcements for select using (published = true or public.is_admin());
create policy "ann_admin" on public.announcements for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "upd_public_read" on public.platform_updates for select using (true);
create policy "upd_admin" on public.platform_updates for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- MENTORIAS / LIVROS (catálogo público)
-- --------------------------------------------------------------------------
create policy "mentorships_public_read" on public.mentorships for select using (published = true or public.is_admin());
create policy "mentorships_admin" on public.mentorships for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "books_public_read" on public.books for select using (published = true or public.is_admin());
create policy "books_admin" on public.books for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- PEDIDOS
-- --------------------------------------------------------------------------
create policy "orders_select_own" on public.orders
  for select to authenticated using (user_id = auth.uid() or public.is_admin());
create policy "orders_admin_all" on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "order_items_select_own" on public.order_items
  for select to authenticated using (
    exists(select 1 from public.orders o where o.id = order_id and (o.user_id = auth.uid() or public.is_admin()))
  );
create policy "order_items_admin" on public.order_items
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- NOTIFICAÇÕES
-- --------------------------------------------------------------------------
create policy "notif_user_read" on public.notifications
  for select to authenticated using (
    (audience = 'user' and user_id = auth.uid())
    or (audience = 'owner' and public.is_admin())
  );
create policy "notif_user_update" on public.notifications   -- marcar como lida
  for update to authenticated using (
    (audience = 'user' and user_id = auth.uid())
    or (audience = 'owner' and public.is_admin())
  ) with check (true);

-- --------------------------------------------------------------------------
-- CONSULTOR IA
-- --------------------------------------------------------------------------
create policy "ai_docs_admin" on public.ai_documents
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "ai_chunks_admin" on public.ai_chunks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "ai_conv_own" on public.ai_conversations
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "ai_msg_own" on public.ai_messages
  for all to authenticated using (
    exists(select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  ) with check (
    exists(select 1 from public.ai_conversations c where c.id = conversation_id and c.user_id = auth.uid())
  );

-- --------------------------------------------------------------------------
-- SITE SETTINGS
-- --------------------------------------------------------------------------
create policy "settings_public_read" on public.site_settings for select using (true);
create policy "settings_admin" on public.site_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- VIEW pública de currículo (títulos/durações sem expor video_url)
-- --------------------------------------------------------------------------
create or replace view public.course_curriculum as
  select l.course_id, m.id as module_id, m.title as module_title, m.sort_order as module_order,
         l.id as lesson_id, l.title as lesson_title, l.duration_seconds, l.is_preview, l.sort_order as lesson_order
  from public.lessons l
  left join public.modules m on m.id = l.module_id
  join public.courses c on c.id = l.course_id
  where c.published = true and l.published = true;
