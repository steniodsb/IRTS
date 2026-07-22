-- ==========================================================================
-- IRTS / NDA ACADEMY — Funções & Triggers
-- ==========================================================================

-- --------------------------------------------------------------------------
-- updated_at automático
-- --------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['profiles','subscriptions','courses','orders'] loop
    execute format(
      'drop trigger if exists trg_updated_at on public.%I;
       create trigger trg_updated_at before update on public.%I
       for each row execute function public.set_updated_at();', t, t);
  end loop;
end $$;

-- --------------------------------------------------------------------------
-- Papel do usuário / admin  (SECURITY DEFINER p/ uso nas policies)
-- --------------------------------------------------------------------------
create or replace function public.current_user_role()
returns user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin','owner')
  );
$$;

-- --------------------------------------------------------------------------
-- Assinatura ativa do usuário?
-- --------------------------------------------------------------------------
create or replace function public.has_active_subscription(uid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.subscriptions
    where user_id = uid and status in ('active','trialing')
      and (current_period_end is null or current_period_end > now())
  );
$$;

-- Acesso ao curso: matrícula OU plano exigido coberto por assinatura ativa
create or replace function public.has_course_access(uid uuid, cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select
    exists(select 1 from public.enrollments e where e.user_id = uid and e.course_id = cid)
    or exists(
      select 1 from public.courses c
      where c.id = cid
        and (c.is_free
             or (c.required_plan_id is not null and public.has_active_subscription(uid)))
    );
$$;

-- --------------------------------------------------------------------------
-- Novo usuário no auth → cria profile + notifica dono
-- --------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;

  insert into public.notifications (audience, type, title, body, data)
  values ('owner','new_signup','Novo cadastro',
          coalesce(new.email,'novo usuário') || ' criou uma conta.',
          jsonb_build_object('user_id', new.id, 'email', new.email));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- --------------------------------------------------------------------------
-- Progresso do curso: recalcula % ao atualizar lesson_progress
-- Emite certificado + notificações (aluno concluiu / dono é avisado)
-- --------------------------------------------------------------------------
create or replace function public.recalc_course_progress()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  total_lessons int;
  done_lessons  int;
  pct           numeric(5,2);
  was_completed boolean;
  uname         text;
  ctitle        text;
begin
  select count(*) into total_lessons
    from public.lessons where course_id = new.course_id and published = true;
  select count(*) into done_lessons
    from public.lesson_progress
    where user_id = new.user_id and course_id = new.course_id and completed = true;

  pct := case when total_lessons = 0 then 0
              else round((done_lessons::numeric / total_lessons) * 100, 2) end;

  select completed_at is not null into was_completed
    from public.enrollments where user_id = new.user_id and course_id = new.course_id;

  update public.enrollments
     set progress_pct   = pct,
         last_activity_at = now(),
         started_at     = coalesce(started_at, now()),
         completed_at   = case when pct >= 100 then coalesce(completed_at, now()) else null end
   where user_id = new.user_id and course_id = new.course_id;

  -- Concluiu agora (100% e antes não estava concluído)
  if pct >= 100 and coalesce(was_completed, false) = false then
    insert into public.certificates (user_id, course_id)
      values (new.user_id, new.course_id)
      on conflict (user_id, course_id) do nothing;

    select full_name into uname from public.profiles where id = new.user_id;
    select title into ctitle from public.courses where id = new.course_id;

    insert into public.notifications (audience, user_id, type, title, body, data)
      values ('user', new.user_id, 'course_completed',
              'Parabéns! Curso concluído',
              'Você concluiu "' || coalesce(ctitle,'o curso') || '". Seu certificado está disponível.',
              jsonb_build_object('course_id', new.course_id));

    insert into public.notifications (audience, type, title, body, data)
      values ('owner','course_completed','Aluno concluiu curso',
              coalesce(uname,'Um aluno') || ' concluiu "' || coalesce(ctitle,'curso') || '".',
              jsonb_build_object('user_id', new.user_id, 'course_id', new.course_id));
  end if;

  return new;
end $$;

drop trigger if exists trg_recalc_progress on public.lesson_progress;
create trigger trg_recalc_progress
  after insert or update on public.lesson_progress
  for each row execute function public.recalc_course_progress();

-- --------------------------------------------------------------------------
-- Fórum: manter reply_count e last_activity_at + notificar dono
-- --------------------------------------------------------------------------
create or replace function public.on_forum_post()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.forum_threads
     set reply_count = reply_count + 1, last_activity_at = now()
   where id = new.thread_id;

  insert into public.notifications (audience, type, title, body, data)
  values ('owner','new_forum_post','Nova resposta no fórum',
          'Há uma nova resposta na comunidade.',
          jsonb_build_object('thread_id', new.thread_id, 'post_id', new.id));
  return new;
end $$;

drop trigger if exists trg_on_forum_post on public.forum_posts;
create trigger trg_on_forum_post
  after insert on public.forum_posts
  for each row execute function public.on_forum_post();

-- --------------------------------------------------------------------------
-- Pedido pago → matrícula automática em cursos + notificação de compra
-- (chamado pelo webhook do gateway ao marcar order.status='paid')
-- --------------------------------------------------------------------------
create or replace function public.on_order_paid()
returns trigger language plpgsql security definer set search_path = public as $$
declare it record; uname text;
begin
  if new.status = 'paid' and coalesce(old.status,'') is distinct from 'paid' then
    select full_name into uname from public.profiles where id = new.user_id;

    for it in select * from public.order_items where order_id = new.id loop
      if it.product_type = 'course' and it.product_id is not null then
        insert into public.enrollments (user_id, course_id, source)
          values (new.user_id, it.product_id, 'purchase')
          on conflict (user_id, course_id) do nothing;
      end if;
    end loop;

    insert into public.notifications (audience, type, title, body, data)
    values ('owner','purchase','Nova compra',
            coalesce(uname,'Um cliente') || ' realizou uma compra de R$ ' ||
            to_char(new.total_cents/100.0,'FM999G990D00') || '.',
            jsonb_build_object('order_id', new.id, 'user_id', new.user_id));

    insert into public.notifications (audience, user_id, type, title, body, data)
    values ('user', new.user_id, 'purchase','Compra confirmada',
            'Seu pagamento foi confirmado e o acesso liberado.',
            jsonb_build_object('order_id', new.id));
  end if;
  return new;
end $$;

drop trigger if exists trg_on_order_paid on public.orders;
create trigger trg_on_order_paid
  after update on public.orders
  for each row execute function public.on_order_paid();

-- --------------------------------------------------------------------------
-- Contador de downloads
-- --------------------------------------------------------------------------
create or replace function public.on_download()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.library_items set download_count = download_count + 1
   where id = new.library_item_id;
  return new;
end $$;

drop trigger if exists trg_on_download on public.downloads;
create trigger trg_on_download
  after insert on public.downloads
  for each row execute function public.on_download();

-- --------------------------------------------------------------------------
-- RAG: busca semântica de trechos da base de conhecimento
-- --------------------------------------------------------------------------
create or replace function public.match_ai_chunks(
  query_embedding vector(1536),
  match_count int default 6,
  similarity_threshold float default 0.5
)
returns table (id uuid, document_id uuid, content text, similarity float, metadata jsonb)
language sql stable as $$
  select c.id, c.document_id, c.content,
         1 - (c.embedding <=> query_embedding) as similarity,
         c.metadata
  from public.ai_chunks c
  where c.embedding is not null
    and 1 - (c.embedding <=> query_embedding) > similarity_threshold
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- --------------------------------------------------------------------------
-- Marca curso como abandonado (job/edge chamará esta função)
-- Aluno com matrícula, sem atividade há 14 dias e < 100% → notifica dono
-- --------------------------------------------------------------------------
create or replace function public.flag_abandoned_courses(idle_days int default 14)
returns int language plpgsql security definer set search_path = public as $$
declare r record; n int := 0;
begin
  for r in
    select e.user_id, e.course_id, p.full_name, c.title
    from public.enrollments e
    join public.profiles p on p.id = e.user_id
    join public.courses c on c.id = e.course_id
    where e.completed_at is null
      and e.progress_pct > 0
      and e.last_activity_at < now() - (idle_days || ' days')::interval
      and not exists (
        select 1 from public.notifications nt
        where nt.type = 'course_abandoned'
          and nt.data->>'user_id' = e.user_id::text
          and nt.data->>'course_id' = e.course_id::text
          and nt.created_at > now() - interval '30 days'
      )
  loop
    insert into public.notifications (audience, type, title, body, data)
    values ('owner','course_abandoned','Curso abandonado',
            coalesce(r.full_name,'Um aluno') || ' não acessa "' || r.title || '" há mais de '
            || idle_days || ' dias.',
            jsonb_build_object('user_id', r.user_id, 'course_id', r.course_id));
    n := n + 1;
  end loop;
  return n;
end $$;
