-- ==========================================================================
-- IRTS / NDA ACADEMY — Schema principal
-- Postgres 17 (Supabase). Executar via `supabase db push` ou SQL Editor.
-- ==========================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";      -- Consultor IA (embeddings)
create extension if not exists "pg_trgm";     -- busca textual

-- --------------------------------------------------------------------------
-- ENUMS
-- --------------------------------------------------------------------------
do $$ begin
  create type user_role       as enum ('student','admin','owner');
  create type plan_interval    as enum ('free','month','year','one_time');
  create type sub_status        as enum ('trialing','active','past_due','canceled','incomplete');
  create type lesson_video      as enum ('upload','youtube','vimeo','mux','external');
  create type enroll_source     as enum ('purchase','plan','manual','free');
  create type library_type      as enum ('ebook','modelo','checklist','act','cct','politica','jurisprudencia');
  create type event_type        as enum ('mentoria','live','evento','webinar');
  create type order_status      as enum ('pending','paid','shipped','delivered','canceled','refunded');
  create type product_type      as enum ('course','book','plan','mentorship');
  create type notif_audience    as enum ('owner','user');
  create type notif_type        as enum ('purchase','course_completed','course_abandoned','new_signup',
                                         'new_forum_post','event_reminder','subscription_canceled','system');
  create type announcement_level as enum ('info','success','warning');
exception when duplicate_object then null; end $$;

-- --------------------------------------------------------------------------
-- PROFILES (estende auth.users)
-- --------------------------------------------------------------------------
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      text,
  avatar_url     text,
  phone          text,
  cpf_cnpj       text,
  role           user_role not null default 'student',
  bio            text,
  -- dados fiscais / endereço (para nota fiscal e envio de livros)
  fiscal         jsonb not null default '{}'::jsonb,  -- {razao_social, ie, address:{...}}
  notify_prefs   jsonb not null default '{"email":true,"push":true}'::jsonb,
  onboarded_at   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- PLANOS & ASSINATURAS
-- --------------------------------------------------------------------------
create table if not exists public.plans (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text unique not null,
  description    text,
  price_cents    integer not null default 0,
  currency       text not null default 'BRL',
  interval       plan_interval not null default 'month',
  stripe_price_id text,
  features       jsonb not null default '[]'::jsonb,
  highlight      boolean not null default false,
  active         boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);

create table if not exists public.subscriptions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  plan_id        uuid references public.plans(id),
  status         sub_status not null default 'active',
  provider       text not null default 'stripe',
  provider_subscription_id text,
  provider_customer_id     text,
  current_period_end       timestamptz,
  cancel_at_period_end     boolean not null default false,
  canceled_at    timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_subscriptions_user on public.subscriptions(user_id);

-- --------------------------------------------------------------------------
-- CURSOS / MÓDULOS / AULAS
-- --------------------------------------------------------------------------
create table if not exists public.courses (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text unique not null,
  subtitle       text,
  description    text,
  cover_url      text,
  trailer_url    text,
  instructor     text,
  category       text,
  level          text default 'iniciante',
  price_cents    integer not null default 0,
  is_free        boolean not null default false,
  required_plan_id uuid references public.plans(id),   -- se preenchido, acesso via plano
  duration_minutes integer default 0,
  published      boolean not null default false,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_courses_published on public.courses(published);

create table if not exists public.modules (
  id             uuid primary key default gen_random_uuid(),
  course_id      uuid not null references public.courses(id) on delete cascade,
  title          text not null,
  sort_order     integer not null default 0
);
create index if not exists idx_modules_course on public.modules(course_id);

create table if not exists public.lessons (
  id             uuid primary key default gen_random_uuid(),
  module_id      uuid references public.modules(id) on delete set null,
  course_id      uuid not null references public.courses(id) on delete cascade,
  title          text not null,
  slug           text,
  description    text,
  video_provider lesson_video not null default 'upload',
  video_url      text,
  storage_path   text,             -- caminho no bucket 'course-videos' (upload)
  duration_seconds integer default 0,
  attachments    jsonb not null default '[]'::jsonb,  -- [{name,url}]
  is_preview     boolean not null default false,      -- amostra pública
  published      boolean not null default true,
  sort_order     integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_lessons_course on public.lessons(course_id);

create table if not exists public.enrollments (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  course_id      uuid not null references public.courses(id) on delete cascade,
  source         enroll_source not null default 'purchase',
  progress_pct   numeric(5,2) not null default 0,
  started_at     timestamptz,
  completed_at   timestamptz,
  last_activity_at timestamptz,
  created_at     timestamptz not null default now(),
  unique(user_id, course_id)
);
create index if not exists idx_enrollments_user on public.enrollments(user_id);

create table if not exists public.lesson_progress (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  lesson_id      uuid not null references public.lessons(id) on delete cascade,
  course_id      uuid not null references public.courses(id) on delete cascade,
  seconds_watched integer not null default 0,
  completed      boolean not null default false,
  completed_at   timestamptz,
  updated_at     timestamptz not null default now(),
  unique(user_id, lesson_id)
);
create index if not exists idx_progress_user_course on public.lesson_progress(user_id, course_id);

create table if not exists public.certificates (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  course_id      uuid not null references public.courses(id) on delete cascade,
  code           text unique not null default encode(gen_random_bytes(8),'hex'),
  issued_at      timestamptz not null default now(),
  pdf_url        text,
  unique(user_id, course_id)
);

-- --------------------------------------------------------------------------
-- BIBLIOTECA
-- --------------------------------------------------------------------------
create table if not exists public.library_items (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  type           library_type not null,
  file_url       text,
  storage_path   text,             -- bucket 'library'
  cover_url      text,
  category       text,
  tags           text[] not null default '{}',
  required_plan_id uuid references public.plans(id),
  is_free        boolean not null default false,
  published      boolean not null default true,
  download_count integer not null default 0,
  created_at     timestamptz not null default now()
);
create index if not exists idx_library_type on public.library_items(type);

create table if not exists public.downloads (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  library_item_id uuid not null references public.library_items(id) on delete cascade,
  created_at     timestamptz not null default now()
);
create index if not exists idx_downloads_user on public.downloads(user_id);

-- --------------------------------------------------------------------------
-- AGENDA (mentorias, lives, eventos, webinars)
-- --------------------------------------------------------------------------
create table if not exists public.events (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  description    text,
  type           event_type not null default 'live',
  starts_at      timestamptz not null,
  ends_at        timestamptz,
  location       text,             -- online / endereço
  join_url       text,
  cover_url      text,
  required_plan_id uuid references public.plans(id),
  capacity       integer,
  published      boolean not null default true,
  created_at     timestamptz not null default now()
);
create index if not exists idx_events_starts on public.events(starts_at);

create table if not exists public.event_registrations (
  id             uuid primary key default gen_random_uuid(),
  event_id       uuid not null references public.events(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique(event_id, user_id)
);

-- --------------------------------------------------------------------------
-- COMUNIDADE (fórum + networking)
-- --------------------------------------------------------------------------
create table if not exists public.forum_categories (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  slug           text unique not null,
  description    text,
  sort_order     integer not null default 0
);

create table if not exists public.forum_threads (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid references public.forum_categories(id) on delete set null,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text not null,
  slug           text,
  body           text not null,
  pinned         boolean not null default false,
  locked         boolean not null default false,
  views          integer not null default 0,
  reply_count    integer not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at     timestamptz not null default now()
);
create index if not exists idx_threads_category on public.forum_threads(category_id);

create table if not exists public.forum_posts (
  id             uuid primary key default gen_random_uuid(),
  thread_id      uuid not null references public.forum_threads(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  body           text not null,
  created_at     timestamptz not null default now()
);
create index if not exists idx_posts_thread on public.forum_posts(thread_id);

-- --------------------------------------------------------------------------
-- INÍCIO / CONTEÚDO DINÂMICO
-- --------------------------------------------------------------------------
create table if not exists public.news (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  summary        text,
  body           text,
  url            text,
  source         text,
  cover_url      text,
  published_at   timestamptz not null default now(),
  published      boolean not null default true
);

create table if not exists public.announcements (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  body           text,
  level          announcement_level not null default 'info',
  published      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table if not exists public.platform_updates (
  id             uuid primary key default gen_random_uuid(),
  version        text,
  title          text not null,
  body           text,
  created_at     timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- OFERTAS PÚBLICAS: MENTORIAS & LIVROS FÍSICOS
-- --------------------------------------------------------------------------
create table if not exists public.mentorships (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text unique not null,
  description    text,
  format         text,             -- individual / grupo / etc.
  price_cents    integer not null default 0,
  cover_url      text,
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

create table if not exists public.books (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  slug           text unique not null,
  author         text,
  description    text,
  cover_url      text,
  price_cents    integer not null default 0,
  stock          integer not null default 0,
  weight_grams   integer default 500,   -- para cálculo de frete (Correios)
  pages          integer,
  published      boolean not null default false,
  created_at     timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- PEDIDOS / PAGAMENTOS
-- --------------------------------------------------------------------------
create table if not exists public.orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  status         order_status not null default 'pending',
  total_cents    integer not null default 0,
  currency       text not null default 'BRL',
  provider       text default 'stripe',
  provider_payment_id text,
  shipping_address jsonb,           -- para livros físicos
  tracking_code  text,              -- código dos Correios
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists idx_orders_user on public.orders(user_id);

create table if not exists public.order_items (
  id             uuid primary key default gen_random_uuid(),
  order_id       uuid not null references public.orders(id) on delete cascade,
  product_type   product_type not null,
  product_id     uuid,
  title          text not null,
  quantity       integer not null default 1,
  unit_price_cents integer not null default 0
);

-- --------------------------------------------------------------------------
-- NOTIFICAÇÕES (dono + aluno)
-- --------------------------------------------------------------------------
create table if not exists public.notifications (
  id             uuid primary key default gen_random_uuid(),
  audience       notif_audience not null default 'user',
  user_id        uuid references public.profiles(id) on delete cascade, -- null quando audience='owner'
  type           notif_type not null,
  title          text not null,
  body           text,
  data           jsonb not null default '{}'::jsonb,
  read_at        timestamptz,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id);
create index if not exists idx_notifications_audience on public.notifications(audience) where read_at is null;

-- --------------------------------------------------------------------------
-- CONSULTOR IA (base de conhecimento + RAG + histórico)
-- --------------------------------------------------------------------------
create table if not exists public.ai_documents (
  id             uuid primary key default gen_random_uuid(),
  title          text not null,
  source         text,             -- origem (curso, ebook, upload...)
  source_type    text,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create table if not exists public.ai_chunks (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid references public.ai_documents(id) on delete cascade,
  content        text not null,
  embedding      vector(1536),     -- text-embedding-3-small
  tokens         integer,
  metadata       jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ai_chunks_embedding
  on public.ai_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table if not exists public.ai_conversations (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  title          text,
  created_at     timestamptz not null default now()
);

create table if not exists public.ai_messages (
  id             uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.ai_conversations(id) on delete cascade,
  role           text not null check (role in ('user','assistant','system')),
  content        text not null,
  citations      jsonb not null default '[]'::jsonb,
  created_at     timestamptz not null default now()
);
create index if not exists idx_ai_messages_conv on public.ai_messages(conversation_id);

-- --------------------------------------------------------------------------
-- CONFIGURAÇÕES DO SITE (bio, contatos, textos públicos)
-- --------------------------------------------------------------------------
create table if not exists public.site_settings (
  key            text primary key,
  value          jsonb not null default '{}'::jsonb,
  updated_at     timestamptz not null default now()
);
