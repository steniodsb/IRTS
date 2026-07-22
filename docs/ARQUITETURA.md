# Arquitetura — IRTS Academy

## Visão geral

```
┌───────────────┐   ┌────────────────┐   ┌────────────────┐
│  Web (Next.js)│   │ iOS (Expo/RN)  │   │ Android (Expo) │
└───────┬───────┘   └────────┬───────┘   └────────┬───────┘
        │                    │                    │
        └──────────── @irts/shared (tipos, tokens, helpers) ──────────┘
                             │
                    ┌────────▼─────────┐
                    │     Supabase     │
                    │  Postgres + RLS  │
                    │  Auth · Storage  │
                    │  Edge Functions  │
                    │  pgvector (RAG)  │
                    └────────┬─────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     │ Anthropic (Claude)    │ Stripe (pagamentos)   │ Resend (e-mail)
     └───────────────────────┴───────────────────────┘
```

Um **único backend** (Supabase) serve os três clientes. A segurança é feita por **Row Level Security
(RLS)** no banco — cada cliente usa a chave pública (anon) e só enxerga o que as políticas permitem.
Operações privilegiadas (webhooks, IA, notificações) rodam em **Edge Functions** com a `service_role`.

## Camadas

- **`packages/shared`** — fonte única de verdade para tipos de domínio, tokens de marca (ouro/preto),
  formatação (BRL, datas) e constantes (menus, rótulos). Web e mobile importam de `@irts/shared`.
- **`apps/web`** — Next.js App Router. Três áreas por _route group_:
  - `(public)` — site institucional/vendas (SSR, sem login).
  - `(auth)` — login/cadastro/recuperação (Supabase Auth, e-mail/senha + Google).
  - `(app)` — área de membros (protegida por `middleware.ts`).
  - `(admin)` — painel administrativo (protegido; só `admin`/`owner`).
- **`apps/mobile`** — Expo Router. Tabs para os menus; mesmo Supabase, sessão persistida em
  SecureStore/AsyncStorage.

## Modelo de dados (resumo)

| Domínio | Tabelas |
|---|---|
| Usuários | `profiles` (papel: student/admin/owner), `site_settings` |
| Planos | `plans`, `subscriptions` |
| Cursos | `courses`, `modules`, `lessons`, `enrollments`, `lesson_progress`, `certificates` |
| Biblioteca | `library_items`, `downloads` |
| Agenda | `events`, `event_registrations` |
| Comunidade | `forum_categories`, `forum_threads`, `forum_posts` |
| Início | `news`, `announcements`, `platform_updates` |
| Loja | `mentorships`, `books`, `orders`, `order_items` |
| Notificações | `notifications` (audience owner/user) |
| Consultor IA | `ai_documents`, `ai_chunks` (vector 1536), `ai_conversations`, `ai_messages` |

Detalhe completo em `supabase/migrations/20260722000100_schema.sql`.

## Regras de acesso (destaques)

- **Cursos**: acesso via `enrollments` (compra/matrícula) **ou** plano ativo (`has_active_subscription`)
  **ou** curso gratuito. Amostras (`lessons.is_preview`) são públicas. Função `has_course_access()`.
- **Vídeos e arquivos** ficam em buckets **privados**; o app pede uma **URL assinada** à função
  `sign-asset`, que valida o acesso antes de assinar. Catálogo/curriculum é exposto pela view
  `course_curriculum` (sem `video_url`).
- **Admin**: `is_admin()` (papel admin/owner) libera CRUD nas policies.

## Automações (triggers no banco)

- Novo usuário no Auth → cria `profiles` + **notifica o dono** (`new_signup`).
- `lesson_progress` atualizado → recalcula `% do curso`, e ao chegar a 100% **emite certificado** e
  notifica aluno + dono (`course_completed`).
- `orders.status = 'paid'` → **matrícula automática** nos cursos comprados + notificação de compra.
- Nova resposta no fórum → notifica o dono.
- `flag_abandoned_courses()` (chamado pela função `cron-abandoned`) → marca "abandono" (sem atividade
  há 14 dias e < 100%) e **notifica o dono**.

## Consultor IA (RAG)

1. Admin envia conteúdo → `ingest-embeddings` divide em trechos e gera embeddings (pgvector).
2. Usuário pergunta → `consultor-ia` embeda a pergunta, busca trechos por similaridade
   (`match_ai_chunks`), monta o contexto e chama o **Claude** com instrução de responder **apenas**
   com esse conteúdo. Histórico salvo em `ai_conversations`/`ai_messages` com **citações**.

## Pagamentos

- Camada agnóstica; implementação de referência em **Stripe** (`checkout` + `stripe-webhook`).
- Assinatura (mensal/anual) em modo `subscription`; cursos/livros em modo `payment`.
- Livros físicos geram `orders` com `shipping_address` e `tracking_code` (Correios) no admin.
- Ver PENDENCIAS.md para a estratégia de assinatura dentro das lojas (in-app vs. web).

## Decisões e trade-offs

- **Supabase** em vez de backend próprio: entrega auth, storage, banco, funções e realtime com um só
  serviço — ideal para o prazo/escopo e para um projeto mantido por uma pessoa.
- **Expo** em vez de nativo puro: um só código para iOS+Android, com caminho de publicação (EAS).
- **Monorepo (pnpm + Turborepo)**: compartilha tipos e marca entre web e mobile sem duplicação.
- **RLS-first**: a regra de acesso mora no banco, então os três clientes herdam a mesma segurança.
