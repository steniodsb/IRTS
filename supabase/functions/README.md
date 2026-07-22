# Edge Functions — IRTS / NDA Academy

Funções Supabase (Deno + TypeScript). Cada função vive em
`supabase/functions/<nome>/index.ts`. Helpers compartilhados em `_shared/`.

| Função              | verify_jwt | O que faz                                                        |
| ------------------- | ---------- | ---------------------------------------------------------------- |
| `consultor-ia`      | true       | Consultor IA (RAG): embed → busca semântica → Claude → histórico |
| `ingest-embeddings` | true       | Ingestão admin da base de conhecimento (chunk + embeddings)      |
| `stripe-webhook`    | false      | Recebe eventos do Stripe (pagamentos, assinaturas)               |
| `checkout`          | true       | Cria sessões de Stripe Checkout / cancela assinatura             |
| `sign-asset`        | true       | URLs assinadas para vídeos, biblioteca e certificados            |
| `cron-abandoned`    | false      | Job diário: marca cursos abandonados + digest por e-mail         |

Os valores de `verify_jwt` já estão declarados em `supabase/config.toml`.

## Variáveis de ambiente por função

`SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` são injetadas automaticamente no
runtime das Edge Functions — não precisam ser definidas manualmente.

| Env var                     | Usada por                          | Status                    |
| --------------------------- | ---------------------------------- | ------------------------- |
| `OPENAI_API_KEY`            | consultor-ia, ingest-embeddings    | **PENDENTE** (chave real) |
| `ANTHROPIC_API_KEY`         | consultor-ia                       | **PENDENTE** (chave real) |
| `IA_MODEL`                  | consultor-ia (default claude-sonnet-5) | opcional              |
| `STRIPE_SECRET_KEY`         | checkout, stripe-webhook           | **PENDENTE** (chave real) |
| `STRIPE_WEBHOOK_SECRET`     | stripe-webhook                     | **PENDENTE** (chave real) |
| `STRIPE_PRICE_MENSAL`       | checkout (fallback de preço)       | **PENDENTE**              |
| `STRIPE_PRICE_ANUAL`        | checkout (fallback de preço)       | **PENDENTE**              |
| `NEXT_PUBLIC_SITE_URL`      | checkout (success/cancel URLs)     | definir por ambiente      |
| `RESEND_API_KEY`            | cron-abandoned (e-mail opcional)   | **PENDENTE** (chave real) |
| `EMAIL_FROM`                | cron-abandoned                     | opcional                  |
| `OWNER_NOTIFY_EMAIL`        | cron-abandoned                     | opcional                  |
| `CRON_SECRET`               | cron-abandoned (proteção opcional) | recomendado               |

> As chaves marcadas **PENDENTE** ainda não foram provisionadas (ver `.env.example`
> e `PENDENCIAS.md`). Cada função degrada com erro 500 claro enquanto a chave
> correspondente não estiver definida — nada quebra silenciosamente.

## Definir secrets

```bash
# Uma a uma:
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
supabase secrets set IA_MODEL=claude-sonnet-5
supabase secrets set STRIPE_SECRET_KEY=sk_live_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_MENSAL=price_...
supabase secrets set STRIPE_PRICE_ANUAL=price_...
supabase secrets set NEXT_PUBLIC_SITE_URL=https://app.irts.com.br
supabase secrets set RESEND_API_KEY=re_...
supabase secrets set EMAIL_FROM="IRTS Academy <no-reply@irts.com.br>"
supabase secrets set OWNER_NOTIFY_EMAIL=newton@exemplo.com.br
supabase secrets set CRON_SECRET=$(openssl rand -hex 24)

# Ou tudo de um arquivo .env:
supabase secrets set --env-file ./.env
```

## Deploy

```bash
# Uma função:
supabase functions deploy consultor-ia

# Webhook do Stripe precisa de verify_jwt=false (já está no config.toml,
# mas pode-se forçar na linha de comando):
supabase functions deploy stripe-webhook --no-verify-jwt
supabase functions deploy cron-abandoned --no-verify-jwt

# Todas:
supabase functions deploy consultor-ia ingest-embeddings stripe-webhook checkout sign-asset cron-abandoned
```

## Testar localmente

```bash
supabase functions serve --env-file ./.env
# então:
curl -i http://localhost:54321/functions/v1/consultor-ia \
  -H "Authorization: Bearer <JWT_DO_USUARIO>" \
  -H "Content-Type: application/json" \
  -d '{"question":"O que é uma CCT?"}'
```

## Notas de integração

- **stripe-webhook**: configure o endpoint no painel do Stripe apontando para
  `https://<projeto>.functions.supabase.co/stripe-webhook` e assine os eventos
  `checkout.session.completed`, `payment_intent.succeeded`,
  `customer.subscription.created|updated|deleted`. Copie o signing secret para
  `STRIPE_WEBHOOK_SECRET`.
- **checkout**: para cursos/livros, cria `orders` (pending) + `order_items` e
  passa `order_id`/`user_id` no metadata; o webhook marca `orders.status='paid'`,
  disparando o trigger `on_order_paid` (matrícula automática + notificações).
- **cron-abandoned**: agende via `pg_cron` ou cron externo (1×/dia). Se definir
  `CRON_SECRET`, envie o header `x-cron-secret`. Chama `flag_abandoned_courses(14)`.
- **sign-asset**: buckets esperados no Storage: `course-videos`, `library`,
  `certificates` (privados).
```
