# Configuração do Supabase

Projeto: **`ivezfeaztisayqatyrkg`** (`https://ivezfeaztisayqatyrkg.supabase.co`).

## 1. Aplicar o schema (migrations)

### Opção A — Supabase CLI (recomendado)
```bash
supabase login
supabase link --project-ref ivezfeaztisayqatyrkg
supabase db push        # aplica tudo em supabase/migrations, em ordem
```

### Opção B — SQL Editor (sem CLI)
No painel → **SQL Editor**, cole e rode **na ordem**:
1. `20260722000100_schema.sql`
2. `20260722000200_functions_triggers.sql`
3. `20260722000300_rls.sql`
4. `20260722000400_storage.sql`
5. `20260722000500_seed.sql`

> As migrations são idempotentes o suficiente para rodar num projeto novo. Se `vector`/`pgvector`
> reclamar, habilite a extensão em **Database → Extensions** (a migration já tenta criar).

## 2. Definir o dono (owner/admin)

Depois de criar sua conta no app (cadastro), rode no SQL Editor (troque o e-mail):
```sql
update public.profiles set role = 'owner'
where id = (select id from auth.users where email = 'newton@exemplo.com.br');
```

## 3. Buckets de Storage

Criados automaticamente pela migration `...400_storage.sql`:
`avatars`, `public-assets`, `course-covers` (públicos) e `course-videos`, `library`, `certificates`
(privados, via URL assinada). Suba a logo em `public-assets` se quiser servi-la pelo Storage.

## 4. Auth

- Providers: **e-mail/senha** (ligado) e **Google** (opcional — configurar Client ID/Secret em
  Authentication → Providers).
- **Redirect URLs**: adicione `http://localhost:3000/**`, a URL de produção e `irts://**` (deep link mobile).
- Confirmação de e-mail: hoje **desligada** (`config.toml`) para testes — **ligar em produção**.

## 5. Secrets das Edge Functions

```bash
supabase secrets set \
  ASAAS_API_KEY=... \
  ASAAS_WEBHOOK_TOKEN=... \
  RESEND_API_KEY=... \
  EMAIL_FROM="IRTS Academy <no-reply@irts.com.br>" \
  OWNER_NOTIFY_EMAIL=newton@exemplo.com.br \
  NEXT_PUBLIC_SITE_URL=https://app.irts.com.br
```
(`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` já existem no runtime das functions.)

## 6. Deploy das Edge Functions
```bash
supabase functions deploy asaas-webhook
supabase functions deploy checkout
supabase functions deploy sign-asset
supabase functions deploy cron-abandoned
```

## 7. Agendar o "abandono de curso" (opcional)
No painel → **Database → Cron** (pg_cron) ou um cron externo chamando a função `cron-abandoned`
1x/dia. Ex. (pg_cron + pg_net):
```sql
select cron.schedule('abandono-diario','0 12 * * *', $$
  select net.http_post(
    url := 'https://ivezfeaztisayqatyrkg.functions.supabase.co/cron-abandoned',
    headers := '{"Content-Type":"application/json"}'::jsonb
  );
$$);
```

## 8. Webhook do Asaas
No painel do Asaas → Integrações → Webhooks → nova configuração:
`https://ivezfeaztisayqatyrkg.supabase.co/functions/v1/asaas-webhook`
Eventos: todos os de cobrança (`PAYMENT_CONFIRMED`, `PAYMENT_RECEIVED`, `PAYMENT_OVERDUE`,
`PAYMENT_REFUNDED`, `PAYMENT_DELETED`, `PAYMENT_CREDIT_CARD_CAPTURE_REFUSED`).
Defina um "token de autenticação" e use o mesmo valor em `ASAAS_WEBHOOK_TOKEN`.

## 9. Gerar os tipos do banco (opcional, melhora o DX)
```bash
pnpm db:types    # → packages/shared/src/database.types.ts
```
