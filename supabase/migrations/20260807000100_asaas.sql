-- ==========================================================================
-- Gateway de pagamento: Stripe → Asaas
--
-- O Asaas cobra por VALOR + CICLO (não por "price id"), então a coluna
-- plans.stripe_price_id deixa de existir. O checkout é nativo (PIX, boleto e
-- cartão dentro da própria plataforma), por isso guardamos o método usado no
-- pedido e o id do cliente Asaas no perfil, para reaproveitar entre compras.
-- ==========================================================================

-- --------------------------------------------------------------------------
-- 1. Cliente Asaas por usuário
--    Criado na primeira compra e reutilizado nas seguintes.
-- --------------------------------------------------------------------------
alter table public.profiles
  add column if not exists asaas_customer_id text;

create unique index if not exists idx_profiles_asaas_customer
  on public.profiles (asaas_customer_id)
  where asaas_customer_id is not null;

-- --------------------------------------------------------------------------
-- 2. Pedidos — método de pagamento escolhido
-- --------------------------------------------------------------------------
alter table public.orders
  add column if not exists payment_method text;

do $$ begin
  alter table public.orders
    add constraint orders_payment_method_check
    check (payment_method is null or payment_method in ('pix', 'boleto', 'credit_card'));
exception when duplicate_object then null; end $$;

alter table public.orders alter column provider set default 'asaas';

-- --------------------------------------------------------------------------
-- 3. Assinaturas
-- --------------------------------------------------------------------------
alter table public.subscriptions alter column provider set default 'asaas';

-- --------------------------------------------------------------------------
-- 4. Planos — sem "price id" externo
-- --------------------------------------------------------------------------
alter table public.plans drop column if exists stripe_price_id;

-- --------------------------------------------------------------------------
-- 5. Registros de exemplo que ficaram marcados como stripe
--    Só os que nunca chegaram a ter um pagamento real associado.
-- --------------------------------------------------------------------------
update public.orders
   set provider = 'asaas'
 where provider = 'stripe' and provider_payment_id is null;

update public.subscriptions
   set provider = 'asaas'
 where provider = 'stripe' and provider_subscription_id is null;
