-- ==========================================================================
-- IRTS — Ferramentas, Alertas Inteligentes e regra de acesso de membro
--        (assinatura ativa OU compra de curso nos últimos 6 meses)
-- ==========================================================================

-- --------------------------------------------------------------------------
-- ACESSO DE MEMBRO
-- Regra: é "membro" quem tem assinatura ativa OU comprou um curso há < 6 meses.
-- --------------------------------------------------------------------------
alter table public.enrollments
  add column if not exists access_expires_at timestamptz;

comment on column public.enrollments.access_expires_at is
  'Fim do acesso de membro concedido por esta compra (padrão: 6 meses). Null = não concede.';

-- Ao matricular por compra, concede 6 meses de acesso ao Hub/Biblioteca/IA.
create or replace function public.set_enrollment_access()
returns trigger language plpgsql as $$
begin
  if new.access_expires_at is null and new.source = 'purchase' then
    new.access_expires_at := now() + interval '6 months';
  end if;
  return new;
end $$;

drop trigger if exists trg_enrollment_access on public.enrollments;
create trigger trg_enrollment_access
  before insert on public.enrollments
  for each row execute function public.set_enrollment_access();

-- Backfill das matrículas por compra já existentes
update public.enrollments
   set access_expires_at = created_at + interval '6 months'
 where source = 'purchase' and access_expires_at is null;

-- Função central de acesso de membro
create or replace function public.has_member_access(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    coalesce(uid is not null, false)
    and (
      public.is_admin()
      or public.has_active_subscription(uid)
      or exists (
        select 1 from public.enrollments e
        where e.user_id = uid
          and e.access_expires_at is not null
          and e.access_expires_at > now()
      )
    );
$$;

-- --------------------------------------------------------------------------
-- ALERTAS INTELIGENTES
-- --------------------------------------------------------------------------
do $$ begin
  create type alert_severity as enum ('info','atencao','critico');
exception when duplicate_object then null; end $$;

create table if not exists public.alerts (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  body          text,
  category      text,          -- convencao | decisao | legislacao | prazo | outro
  severity      alert_severity not null default 'info',
  url           text,
  source        text,
  published     boolean not null default true,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);
create index if not exists idx_alerts_published on public.alerts(published_at desc);

create table if not exists public.alert_reads (
  id         uuid primary key default gen_random_uuid(),
  alert_id   uuid not null references public.alerts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  read_at    timestamptz not null default now(),
  unique(alert_id, user_id)
);

-- --------------------------------------------------------------------------
-- FERRAMENTAS (recursos práticos gerenciados pelo admin)
-- As calculadoras nativas vivem em rotas do app (campo `route`);
-- planilhas/links externos usam `url`.
-- --------------------------------------------------------------------------
create table if not exists public.tools (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text unique not null,
  description   text,
  kind          text not null default 'calculadora', -- calculadora|simulador|matriz|cronograma|planilha
  icon          text,
  route         text,          -- rota interna (ex.: /app/ferramentas/reajuste)
  url           text,          -- link externo / planilha
  published     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

-- --------------------------------------------------------------------------
-- RLS
-- --------------------------------------------------------------------------
alter table public.alerts       enable row level security;
alter table public.alert_reads  enable row level security;
alter table public.tools        enable row level security;

drop policy if exists "alerts_members_read" on public.alerts;
create policy "alerts_members_read" on public.alerts
  for select to authenticated
  using (published = true and public.has_member_access(auth.uid()));

drop policy if exists "alerts_admin_all" on public.alerts;
create policy "alerts_admin_all" on public.alerts
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "alert_reads_own" on public.alert_reads;
create policy "alert_reads_own" on public.alert_reads
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "tools_members_read" on public.tools;
create policy "tools_members_read" on public.tools
  for select to authenticated
  using (published = true and public.has_member_access(auth.uid()));

drop policy if exists "tools_admin_all" on public.tools;
create policy "tools_admin_all" on public.tools
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- --------------------------------------------------------------------------
-- Seed inicial das ferramentas nativas
-- --------------------------------------------------------------------------
insert into public.tools (name, slug, description, kind, route, sort_order) values
  ('Calculadora de reajuste salarial','reajuste',
   'Calcule reajuste com base em índice (INPC/IPCA) e ganho real, e veja o impacto na folha.',
   'calculadora','/app/ferramentas/reajuste',0),
  ('Simulador de impacto financeiro','impacto',
   'Projete o custo anual de uma proposta: massa salarial, encargos, benefícios e cláusulas econômicas.',
   'simulador','/app/ferramentas/impacto',1),
  ('Calculadora de banco de horas','banco-de-horas',
   'Saldo de horas, limites de compensação e prazo do acordo.',
   'calculadora','/app/ferramentas/banco-de-horas',2),
  ('Matriz de negociação','matriz',
   'Priorize cláusulas por impacto financeiro x relevância sindical e defina sua zona de acordo.',
   'matriz','/app/ferramentas/matriz',3),
  ('Cronograma da data-base','cronograma',
   'Contagem regressiva e marcos da negociação a partir da data-base da categoria.',
   'cronograma','/app/ferramentas/cronograma',4)
on conflict (slug) do nothing;

-- --------------------------------------------------------------------------
-- Guias estratégicos públicos: marcar itens da biblioteca como públicos
-- (is_free = true já é lido sem login pela policy library_public_read)
-- --------------------------------------------------------------------------
comment on column public.library_items.is_free is
  'true = material aberto ao público (aparece em /guias, sem login).';
