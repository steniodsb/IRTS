# Edge Functions — IRTS / NDA Academy

Funções Supabase (Deno + TypeScript). Cada função vive em
`supabase/functions/<nome>/index.ts`. Helpers compartilhados em `_shared/`.

| Função              | verify_jwt | O que faz                                                        |
| ------------------- | ---------- | ---------------------------------------------------------------- |
| `consultor-ia`      | true       | Consultor IA (RAG): embed → busca semântica → Claude → histórico |
| `ingest-embeddings` | true       | Ingestão admin da base de conhecimento (chunk + embeddings)      |
| `asaas-webhook`     | false      | Recebe eventos de cobrança do Asaas (pagamentos, assinaturas)    |
| `checkout`          | true       | Cobranças e assinaturas no Asaas (PIX/boleto/cartão) + cancelamento |
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
| `ASAAS_API_KEY`             | checkout, asaas-webhook            | fornecida (produção)      |
| `ASAAS_ENV`                 | checkout (força sandbox/production)| opcional                  |
| `ASAAS_WEBHOOK_TOKEN`       | asaas-webhook                      | fornecida                 |
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
supabase secrets set ASAAS_API_KEY='$aact_prod_...'
supabase secrets set ASAAS_WEBHOOK_TOKEN=...
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

# O webhook do Asaas precisa de verify_jwt=false (já está no config.toml,
# mas pode-se forçar na linha de comando):
supabase functions deploy asaas-webhook --no-verify-jwt
supabase functions deploy cron-abandoned --no-verify-jwt

# Todas:
supabase functions deploy consultor-ia ingest-embeddings asaas-webhook checkout sign-asset cron-abandoned
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

- **asaas-webhook**: configure o endpoint no painel do Asaas apontando para
  `https://<projeto>.supabase.co/functions/v1/asaas-webhook`, assine os eventos
  de cobrança (`PAYMENT_*`) e use em `ASAAS_WEBHOOK_TOKEN` o mesmo token de
  autenticação definido lá.
- **checkout**: para cursos/livros, cria `orders` (pending) + `order_items` e
  passa `order_id`/`user_id` no metadata; o webhook marca `orders.status='paid'`,
  disparando o trigger `on_order_paid` (matrícula automática + notificações).
- **cron-abandoned**: agende via `pg_cron` ou cron externo (1×/dia). Se definir
  `CRON_SECRET`, envie o header `x-cron-secret`. Chama `flag_abandoned_courses(14)`.
- **sign-asset**: buckets esperados no Storage: `course-videos`, `library`,
  `certificates` (privados).
```

## Pagamentos (Asaas)

O checkout é **nativo**: a função `checkout` cria a cobrança na API do Asaas e
devolve para o site o QR Code do PIX, a linha digitável do boleto ou o
resultado do cartão. O aluno resolve tudo em `/checkout`, sem redirecionamento.

Fluxo de liberação de acesso:

1. `checkout` cria o pedido como `pending` (ou a assinatura como `incomplete`).
2. O aluno paga.
3. `asaas-webhook` recebe `PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED` e marca o
   pedido como `paid` — o trigger `on_order_paid` matricula e notifica — ou
   ativa a assinatura estendendo `current_period_end`.
4. Como rede de segurança, a tela de espera também consulta
   `checkout?action=status`, que pergunta direto ao Asaas caso o webhook
   atrase.

Cadastre o webhook no painel do Asaas apontando para:

```
https://ivezfeaztisayqatyrkg.supabase.co/functions/v1/asaas-webhook
```

com os eventos de cobrança (`PAYMENT_*`) e o mesmo token de autenticação
definido em `ASAAS_WEBHOOK_TOKEN`.
