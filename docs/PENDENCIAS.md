# PENDÊNCIAS — o que preciso de você (Newton) para colocar 100% no ar

> A estrutura completa (web, iOS/Android, banco de dados, painel admin, Consultor IA, pagamentos,
> notificações) **já está construída**. O que falta abaixo são **contas, chaves e conteúdos** que,
> pelo contrato (Anexo I / Cláusula 9.3), são fornecidos pelo CONTRATANTE. Enquanto não chegarem,
> deixei tudo funcionando com dados de exemplo e degradação clara (sem quebrar).

## 🧭 Decisões e prioridades (atualizado 2026-07-22)

- **Consultor IA** → **stand by** (não desenvolver/ligar agora).
- **Pagamentos** → **decidir depois** (deixar para testar mais adiante). Stripe segue implementado como referência.
- **Apple / Google (lojas)** → **por último**.
- **Resend (e-mail)** → o cliente vai **enviar a chave**; integro assim que chegar.
- **Próximo passo sugerido (sem depender de chaves):** `pnpm install` + `typecheck` para o projeto compilar,
  e aplicar as migrations no Supabase (`supabase db push`) para o banco entrar no ar.

## 🔴 Bloqueadores (sem isso, o recurso não funciona)

### 1. Consultor IA — chaves de API
- [ ] **Anthropic (Claude)** — criar chave em https://console.anthropic.com → `ANTHROPIC_API_KEY`
- [ ] **OpenAI (embeddings)** — chave em https://platform.openai.com → `OPENAI_API_KEY`
      (usada só para indexar o conteúdo; barato). Alternativa: Voyage AI.
- [ ] **Base de conhecimento**: enviar os conteúdos que a IA pode usar (apostilas, aulas transcritas,
      modelos, pareceres). Eu rodo a ingestão (função `ingest-embeddings`) e a IA passa a responder
      **somente** com esse material.

### 2. Pagamentos / Assinaturas
- [ ] **Decisão de gateway**: implementei **Stripe** (assinatura mensal/anual + compra avulsa de
      curso/livro, com PIX e cartão). Se preferir **Mercado Pago / Asaas** (mais comum p/ PIX e boleto
      no Brasil), me avise que troco a integração — a arquitetura já é agnóstica.
- [ ] Conta no gateway + chaves: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
      `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
- [ ] Criar os produtos/preços (mensal e anual) e me passar os IDs (`STRIPE_PRICE_MENSAL`, `STRIPE_PRICE_ANUAL`).
- [ ] **Definir os valores** dos planos e dos cursos/livros (deixei exemplos: mensal R$97, anual R$970).

### 3. Publicação nas lojas (App Store / Google Play)
- [ ] **Apple Developer Program** — US$ 99/ano (conta da NDA/Newton). Necessário p/ publicar iOS.
- [ ] **Google Play Console** — US$ 25 (taxa única). Necessário p/ publicar Android.
- [ ] Acesso a essas contas (ou me adicionar como desenvolvedor) para eu submeter os apps.
- [ ] **Regra importante das lojas**: Apple e Google exigem que **assinaturas de conteúdo digital**
      usem o pagamento **in-app** delas (comissão ~15–30%). Precisamos decidir a estratégia
      (ver seção "Decisões" abaixo).

### 4. E-mail transacional (notificações e recuperação de senha)
- [ ] **Resend** (ou SMTP) — `RESEND_API_KEY`, domínio verificado, `EMAIL_FROM`.
- [ ] `OWNER_NOTIFY_EMAIL` — para onde enviar os avisos de "comprou / concluiu / abandonou".

## 🟡 Conteúdo (para deixar de ser exemplo)

- [ ] **Cursos** (vídeos + descrições). Onde hospedar os vídeos? Opções: (a) upload no próprio
      Supabase Storage (já pronto, bucket privado com URL assinada); (b) YouTube não listado; (c) Vimeo;
      (d) Mux. Recomendo (b/c) para custo/entrega; (a) se quiser tudo dentro da plataforma.
- [ ] **Biblioteca**: e-books, modelos, checklists, ACTs, CCTs, políticas, jurisprudência (arquivos).
- [ ] **Bio oficial** do Newton + foto (área pública "Sobre").
- [ ] **Textos da home**, contatos (WhatsApp, Instagram, LinkedIn, e-mail).
- [ ] **Livros físicos**: título, preço, peso (frete Correios), estoque.
- [ ] **Termos de uso** e **Política de privacidade** (deixei modelos — revisar juridicamente / LGPD).
- [ ] **Logo em alta / ícone do app** (a logo enviada foi usada; ideal ter versão quadrada 1024×1024 p/ ícone).

## 🟢 Configuração que eu faço (só preciso de acesso)

- [ ] Aplicar as migrations no Supabase (`supabase db push`) — ou você me confirma que posso.
- [ ] Definir seu usuário como **owner** (admin) após você criar a conta.
- [ ] Configurar os "secrets" das edge functions no Supabase.
- [ ] Hospedar o Web App (recomendo **Vercel**) e, ao quitar, migrar para a hospedagem de vocês (Cláusula 5.2).

## ⚖️ Decisões que dependem de você

1. **Assinatura nas lojas (in-app vs. web).** Para evitar a comissão da Apple/Google, o modelo comum é:
   vender a assinatura **no site** (web) e o app apenas **libera o acesso** de quem já é assinante
   (sem botão de compra dentro do app, como fazem Netflix/Spotify). Recomendo esse caminho.
   Alternativa: usar o pagamento in-app (mais simples de aprovar, porém com comissão).
2. **Gateway de pagamento**: Stripe (implementado) x Mercado Pago x Asaas.
3. **Hospedagem dos vídeos** (ver acima).
4. **Confirmação de e-mail no cadastro**: hoje está desligada p/ facilitar testes; recomendo ligar em produção.

---
Qualquer item acima que você me liberar, eu integro. Nada aqui muda a estrutura — é "plugar e ligar".
