'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

type Plan = {
  id?: string;
  name?: string; slug?: string; description?: string | null;
  price_cents?: number; interval?: string; stripe_price_id?: string | null;
  features?: string[]; highlight?: boolean; active?: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function PlanForm({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!plan?.id;

  const [f, setF] = useState<Plan>({
    name: plan?.name ?? '',
    slug: plan?.slug ?? '',
    description: plan?.description ?? '',
    interval: plan?.interval ?? 'month',
    stripe_price_id: plan?.stripe_price_id ?? '',
    highlight: plan?.highlight ?? false,
    active: plan?.active ?? true,
  });
  const [priceReais, setPriceReais] = useState(((plan?.price_cents ?? 0) / 100).toString());
  const [featuresText, setFeaturesText] = useState((plan?.features ?? []).join('\n'));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Plan>(k: K, v: Plan[K]) { setF((p) => ({ ...p, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const features = featuresText.split('\n').map((s) => s.trim()).filter(Boolean);
    const payload = {
      name: f.name,
      slug: f.slug || slugify(f.name ?? ''),
      description: f.description || null,
      price_cents: Math.round(parseFloat(priceReais || '0') * 100) || 0,
      interval: f.interval,
      stripe_price_id: f.stripe_price_id || null,
      features,
      highlight: f.highlight,
      active: f.active,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from('plans').update(payload).eq('id', plan!.id);
        if (error) throw error;
        setMsg({ ok: true, text: 'Plano atualizado.' });
      } else {
        const { error } = await supabase.from('plans').insert(payload);
        if (error) throw error;
        setMsg({ ok: true, text: 'Plano criado.' });
        setF({ name: '', slug: '', description: '', interval: 'month', stripe_price_id: '', highlight: false, active: true });
        setPriceReais('0');
        setFeaturesText('');
      }
      router.refresh();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message ?? 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl text-cream">{isEdit ? 'Editar plano' : 'Novo plano'}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Nome</label>
          <input className="input" value={f.name ?? ''} required
            onChange={(e) => { set('name', e.target.value); if (!isEdit) set('slug', slugify(e.target.value)); }} />
        </div>
        <div>
          <label className="label">Slug</label>
          <input className="input" value={f.slug ?? ''} required onChange={(e) => set('slug', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea className="input min-h-20" value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Preço (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={priceReais} onChange={(e) => setPriceReais(e.target.value)} />
        </div>
        <div>
          <label className="label">Intervalo</label>
          <select className="input" value={f.interval ?? 'month'} onChange={(e) => set('interval', e.target.value)}>
            <option value="free">Gratuito</option>
            <option value="month">Mensal</option>
            <option value="year">Anual</option>
            <option value="one_time">Único</option>
          </select>
        </div>
      </div>
      <div>
        <label className="label">Stripe Price ID (opcional)</label>
        <input className="input" placeholder="price_..." value={f.stripe_price_id ?? ''} onChange={(e) => set('stripe_price_id', e.target.value)} />
      </div>
      <div>
        <label className="label">Recursos (um por linha)</label>
        <textarea className="input min-h-28" placeholder={'Acesso a todos os cursos\nComunidade exclusiva\nCertificados'} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
      </div>
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm text-cream/70">
          <input type="checkbox" checked={!!f.highlight} onChange={(e) => set('highlight', e.target.checked)} /> Destaque
        </label>
        <label className="flex items-center gap-2 text-sm text-cream/70">
          <input type="checkbox" checked={!!f.active} onChange={(e) => set('active', e.target.checked)} /> Ativo
        </label>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Salvar <Save size={16} /></>}</Button>
    </form>
  );
}
