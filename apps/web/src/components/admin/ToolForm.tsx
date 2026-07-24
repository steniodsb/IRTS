'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

type Tool = {
  id?: string;
  name?: string; slug?: string; description?: string | null;
  kind?: string; route?: string | null; url?: string | null;
  published?: boolean; sort_order?: number;
};

const KINDS = [
  { value: 'calculadora', label: 'Calculadora' },
  { value: 'simulador', label: 'Simulador' },
  { value: 'matriz', label: 'Matriz' },
  { value: 'cronograma', label: 'Cronograma' },
  { value: 'planilha', label: 'Planilha / link externo' },
];

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function ToolForm({ tool }: { tool?: Tool }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!tool?.id;

  const [f, setF] = useState<Tool>({
    name: tool?.name ?? '',
    slug: tool?.slug ?? '',
    description: tool?.description ?? '',
    kind: tool?.kind ?? 'calculadora',
    route: tool?.route ?? '',
    url: tool?.url ?? '',
    published: tool?.published ?? true,
    sort_order: tool?.sort_order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Tool>(k: K, v: Tool[K]) { setF((p) => ({ ...p, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const payload = {
      name: f.name,
      slug: f.slug || slugify(f.name ?? ''),
      description: f.description || null,
      kind: f.kind,
      route: f.route || null,
      url: f.url || null,
      published: f.published,
      sort_order: Number(f.sort_order) || 0,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from('tools').update(payload).eq('id', tool!.id);
        if (error) throw error;
        setMsg({ ok: true, text: 'Ferramenta atualizada.' });
      } else {
        const { error } = await supabase.from('tools').insert(payload);
        if (error) throw error;
        setMsg({ ok: true, text: 'Ferramenta criada.' });
        setF({ name: '', slug: '', description: '', kind: 'calculadora', route: '', url: '', published: true, sort_order: 0 });
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
      <h2 className="font-serif text-xl text-cream">{isEdit ? 'Editar ferramenta' : 'Nova ferramenta'}</h2>
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
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={f.kind} onChange={(e) => set('kind', e.target.value)}>
            {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Rota interna</label>
          <input className="input" placeholder="/app/ferramentas/..." value={f.route ?? ''} onChange={(e) => set('route', e.target.value)} />
        </div>
        <div>
          <label className="label">Link externo</label>
          <input className="input" placeholder="https://…" value={f.url ?? ''} onChange={(e) => set('url', e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Ordem</label>
          <input className="input" type="number" value={f.sort_order ?? 0} onChange={(e) => set('sort_order', Number(e.target.value))} />
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-cream/70">
          <input type="checkbox" checked={!!f.published} onChange={(e) => set('published', e.target.checked)} /> Publicada
        </label>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando…' : isEdit ? <>Salvar <Save size={16} /></> : <>Adicionar <Plus size={16} /></>}
      </Button>
    </form>
  );
}
