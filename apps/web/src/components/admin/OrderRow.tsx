'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { formatBRL, formatDate } from '@irts/shared';

const STATUS = [
  { value: 'pending', label: 'Pendente' },
  { value: 'paid', label: 'Pago' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregue' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'refunded', label: 'Reembolsado' },
];

export function OrderRow({ order }: { order: any }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(order.status);
  const [tracking, setTracking] = useState(order.tracking_code ?? '');
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState(false);

  async function save() {
    setSaving(true); setOk(false);
    const { error } = await supabase.from('orders')
      .update({ status, tracking_code: tracking || null, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    setSaving(false);
    if (!error) { setOk(true); router.refresh(); setTimeout(() => setOk(false), 2000); }
  }

  return (
    <tr className="text-cream/80 align-top">
      <td className="px-5 py-3">
        <p className="font-mono text-xs text-cream/50">#{String(order.id).slice(0, 8)}</p>
        <p className="text-cream">{order.profiles?.full_name ?? 'Cliente'}</p>
        <p className="text-xs text-cream/40">{formatDate(order.created_at)}</p>
      </td>
      <td className="px-5 py-3">{formatBRL(order.total_cents)}</td>
      <td className="px-5 py-3">
        <select className="input max-w-36 py-1.5" value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </td>
      <td className="px-5 py-3">
        <input className="input max-w-40 py-1.5" placeholder="Rastreio" value={tracking} onChange={(e) => setTracking(e.target.value)} />
      </td>
      <td className="px-5 py-3">
        <button onClick={save} disabled={saving} className="btn-outline py-1.5">
          {ok ? <><Check size={15} /> Salvo</> : saving ? 'Salvando…' : 'Salvar'}
        </button>
      </td>
    </tr>
  );
}
