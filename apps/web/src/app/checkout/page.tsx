import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { EmptyState, LinkButton } from '@/components/ui';
import { CheckoutForm, type ItemCheckout } from '@/components/checkout/CheckoutForm';

/**
 * Checkout nativo. A compra acontece inteira aqui dentro:
 *
 *   /checkout?type=subscription&plan=<slug>
 *   /checkout?type=course&id=<uuid>
 *   /checkout?type=book&id=<uuid>
 */
export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { type?: string; plan?: string; id?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const query = new URLSearchParams(
    Object.entries(searchParams).filter(([, v]) => !!v) as [string, string][],
  ).toString();

  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/checkout?${query}`)}`);

  const tipo = searchParams.type;
  let item: ItemCheckout | null = null;

  if (tipo === 'subscription' && searchParams.plan) {
    const { data: plano } = await supabase
      .from('plans')
      .select('name, slug, description, price_cents, interval')
      .eq('slug', searchParams.plan)
      .eq('active', true)
      .maybeSingle();

    if (plano && plano.price_cents > 0) {
      item = {
        tipo: 'subscription',
        titulo: plano.name,
        subtitulo: plano.description,
        precoCents: plano.price_cents,
        planSlug: plano.slug,
        intervalo: plano.interval,
      };
    }
  } else if (tipo === 'course' && searchParams.id) {
    const { data: curso } = await supabase
      .from('courses')
      .select('id, title, subtitle, price_cents')
      .eq('id', searchParams.id)
      .eq('published', true)
      .maybeSingle();

    if (curso && (curso.price_cents ?? 0) > 0) {
      item = {
        tipo: 'course',
        titulo: curso.title,
        subtitulo: curso.subtitle,
        precoCents: curso.price_cents!,
        produtoId: curso.id,
      };
    }
  } else if (tipo === 'book' && searchParams.id) {
    const { data: livro } = await supabase
      .from('books')
      .select('id, title, author, price_cents, stock')
      .eq('id', searchParams.id)
      .eq('published', true)
      .maybeSingle();

    if (livro && (livro.price_cents ?? 0) > 0 && (livro.stock ?? 0) > 0) {
      item = {
        tipo: 'book',
        titulo: livro.title,
        subtitulo: livro.author,
        precoCents: livro.price_cents!,
        produtoId: livro.id,
      };
    }
  }

  if (!item) {
    return (
      <EmptyState
        title="Não encontramos este item"
        description="O produto pode ter saído do ar, ficado sem estoque ou o link estar incompleto."
        action={<LinkButton href="/planos" variant="gold" className="mt-2">Ver planos</LinkButton>}
      />
    );
  }

  const { data: perfil } = await supabase
    .from('profiles')
    .select('full_name, cpf_cnpj, phone, fiscal')
    .eq('id', user.id)
    .maybeSingle();

  return <CheckoutForm item={item} perfil={perfil ?? {}} />;
}
