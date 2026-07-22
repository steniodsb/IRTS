import { Card, EmptyState } from '@/components/ui';
import { OrderRow } from '@/components/admin/OrderRow';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Pedidos' };

export default async function AdminPedidosPage() {
  const supabase = createClient();
  const { data: orders } = await supabase
    .from('orders')
    .select('*, profiles(full_name)')
    .order('created_at', { ascending: false });

  const list = (orders ?? []) as any[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-cream">Pedidos</h1>
        <p className="mt-1 text-cream/50">Acompanhe pagamentos e informe o rastreio dos livros físicos.</p>
      </div>

      {list.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-line/60 text-left text-cream/50">
              <tr>
                <th className="px-5 py-3 font-medium">Pedido / Cliente</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Rastreio</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {list.map((o) => <OrderRow key={o.id} order={o} />)}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState title="Nenhum pedido" description="Os pedidos realizados aparecerão aqui." />
      )}
    </div>
  );
}
