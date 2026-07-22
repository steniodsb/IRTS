# IRTS Academy — Área de Membros (Web · iOS · Android)

Plataforma de área de membros do **IRTS — Inteligência em Relações Trabalhistas e Sindicais**
(cliente: Newton dos Anjos Sociedade Individual de Advocacia). Projeto "NDA Academy" do contrato.

Uma única base de conhecimento (Supabase) alimentando **três clientes**:

| Cliente | Stack | Destino |
|---|---|---|
| **Web App** | Next.js 14 (App Router) + Tailwind | Navegador / hospedagem do cliente |
| **iOS** | Expo / React Native | App Store |
| **Android** | Expo / React Native | Google Play |

## Módulos da área de membros (escopo do contrato)

🏠 **Início** · notícias trabalhistas, novos vídeos, próxima live, avisos, atualizações
🎓 **Meus Cursos** · cursos adquiridos, progresso, continuar assistindo, certificados
📚 **Biblioteca** · e-books, modelos, checklists, ACTs, CCTs, políticas, jurisprudência comentada
🤖 **Consultor IA** · perguntas respondidas **apenas** com o conteúdo da plataforma (RAG + Claude)
📅 **Agenda** · mentorias, lives, eventos, webinars
👥 **Comunidade** · fórum, perguntas, networking
👤 **Minha Conta** · dados, foto, senha, plano, assinatura, pagamentos, dados fiscais, downloads, cancelar

Também: **área pública** (bio, cursos, mentorias, livros físicos, planos), **painel administrativo**,
**venda de cursos gravados**, **certificados**, **venda de livros físicos** (envio pelos Correios),
**assinatura mensal/anual** e **notificações ao dono** (quem comprou, concluiu, abandonou, se cadastrou).

## Estrutura do monorepo

```
.
├── apps/
│   ├── web/          # Next.js 14 — público + membros + admin
│   └── mobile/       # Expo/React Native — iOS + Android
├── packages/
│   └── shared/       # tipos, tokens de marca, helpers, client Supabase
├── supabase/
│   ├── migrations/   # schema, RLS, triggers, storage, seed (SQL portável)
│   ├── functions/    # edge functions (Consultor IA, Stripe, notificações)
│   └── config.toml
├── docs/             # ARQUITETURA, DEPLOY, PENDENCIAS, CONFIGURACAO-SUPABASE
└── _client/          # contrato + material do cliente (NÃO versionado)
```

## Começando (desenvolvimento)

Pré-requisitos: **Node 20+**, **pnpm 9+**, **Supabase CLI**, (para mobile) **Expo**.

```bash
pnpm install                 # instala tudo (monorepo)
cp .env.example .env          # o .env real já foi gerado a partir do material do cliente

# 1) Banco de dados (aplicar schema no projeto Supabase)
supabase link --project-ref ivezfeaztisayqatyrkg
supabase db push              # aplica as migrations de supabase/migrations
#   (alternativa sem CLI: colar cada .sql no SQL Editor do painel, em ordem)

# 2) Web
pnpm dev:web                  # http://localhost:3000

# 3) Mobile
pnpm dev:mobile               # Expo — abrir no Expo Go / simulador
```

> ⚠️ Antes de tudo funcionar 100%, veja **[docs/PENDENCIAS.md](docs/PENDENCIAS.md)** — há chaves de API
> e contas de loja que **dependem do cliente** (Anthropic, Stripe, Apple/Google, etc.).

## Documentação

- 📐 [docs/ARQUITETURA.md](docs/ARQUITETURA.md) — visão técnica, modelo de dados, decisões
- 🚀 [docs/DEPLOY.md](docs/DEPLOY.md) — publicar web + submeter às lojas
- ⚙️ [docs/CONFIGURACAO-SUPABASE.md](docs/CONFIGURACAO-SUPABASE.md) — aplicar migrations, buckets, secrets
- 📝 [docs/PENDENCIAS.md](docs/PENDENCIAS.md) — **o que falta / o que preciso de você**

---
Desenvolvido por **AEO Soluções Digitais** (Stenio Galvão). Uso e propriedade conforme contrato.
