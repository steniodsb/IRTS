# Deploy — Web + App Store + Google Play

## Web App (Next.js) — Vercel (ambiente de homologação)

1. Importar o repositório `IRTS` na **Vercel**.
2. **Root Directory**: `apps/web`. Framework: Next.js. Build detectado automaticamente
   (o monorepo pnpm é reconhecido; `transpilePackages` já inclui `@irts/shared`).
3. **Environment Variables** (copiar do `.env`):
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
   `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, etc.
4. Deploy. Ajustar as **Redirect URLs** do Supabase Auth para o domínio da Vercel.
5. Na quitação (Cláusula 5.2), migrar para a hospedagem/domínio do cliente (ex.: `app.irts.com.br`).

> O Web App também roda como **PWA-friendly** no navegador do celular; os apps nativos abaixo são os
> das lojas.

## Mobile (Expo) — App Store & Google Play via EAS

Pré: `npm i -g eas-cli`, `eas login` (conta Expo), contas **Apple Developer** e **Google Play Console**
(fornecidas pelo cliente — ver PENDENCIAS.md).

```bash
cd apps/mobile
eas init                       # cria o projeto EAS (guarda o projectId em app.json)
eas build --platform ios       # gera .ipa
eas build --platform android   # gera .aab
eas submit --platform ios      # envia para a App Store Connect
eas submit --platform android  # envia para o Google Play
```

Configurar em `apps/mobile/app.json` (já preenchido):
- `ios.bundleIdentifier` = `br.com.irts.academy`
- `android.package` = `br.com.irts.academy`
- ícones/splash (usar versão quadrada 1024×1024 da logo — pendente).

### ⚠️ Regra de assinaturas nas lojas
Apple/Google exigem **pagamento in-app** para desbloquear conteúdo digital **dentro do app**.
Estratégia recomendada (evita comissão): vender a assinatura **no site** e o app apenas **liberar
acesso** de quem já é assinante (sem botão de compra no app). Decisão em PENDENCIAS.md.

## Edge Functions (Supabase)
Ver `docs/CONFIGURACAO-SUPABASE.md` §5–§8 (secrets, deploy, webhook, cron).

## Checklist de "go-live"
- [ ] Migrations aplicadas + owner definido
- [ ] Secrets configurados (IA, Stripe, Resend)
- [ ] Web publicada + Redirect URLs atualizadas
- [ ] Confirmação de e-mail ligada
- [ ] Conteúdo real carregado (cursos, biblioteca, bio, planos)
- [ ] Base de conhecimento da IA ingerida
- [ ] Produtos/preços do Stripe criados + webhook ativo
- [ ] Apps buildados e submetidos às lojas
- [ ] Termos e Política de Privacidade revisados
