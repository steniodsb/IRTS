-- ==========================================================================
-- IRTS — Alerta publicado dispara notificação automática para os membros
-- (aparece no sino de cada aluno/membro; e-mail depende do Resend configurado)
-- ==========================================================================

create or replace function public.on_alert_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Só notifica quando o alerta está (ou passou a ficar) publicado.
  if new.published = true and (tg_op = 'INSERT' or coalesce(old.published, false) = false) then
    insert into public.notifications (audience, user_id, type, title, body, data)
    select 'user', p.id, 'system',
           'Novo alerta: ' || new.title,
           coalesce(new.body, 'Um novo alerta foi publicado.'),
           jsonb_build_object('alert_id', new.id, 'category', new.category, 'severity', new.severity)
    from public.profiles p
    where
      -- membros: assinatura ativa OU compra de curso nos últimos 6 meses OU equipe
      public.has_active_subscription(p.id)
      or exists (
        select 1 from public.enrollments e
        where e.user_id = p.id
          and e.access_expires_at is not null
          and e.access_expires_at > now()
      )
      or p.role in ('admin', 'owner');
  end if;
  return new;
end $$;

drop trigger if exists trg_on_alert_published on public.alerts;
create trigger trg_on_alert_published
  after insert or update of published on public.alerts
  for each row execute function public.on_alert_published();
