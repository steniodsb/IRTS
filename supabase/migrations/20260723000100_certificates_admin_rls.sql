-- ==========================================================================
-- IRTS — Admin pode emitir/excluir certificados manualmente
-- (antes só existia a policy de SELECT do próprio dono, e a emissão
--  automática pelo trigger security definer)
-- ==========================================================================
drop policy if exists "cert_admin_all" on public.certificates;
create policy "cert_admin_all" on public.certificates
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
