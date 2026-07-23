'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { createClient } from '@/lib/supabase/client';

type Mentorship = {
  id?: string;
  title?: string; slug?: string; description?: string | null;
  format?: string | null; cover_url?: string | null;
  price_cents?: number; published?: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function MentorshipForm({ mentorship }: { mentorship?: Mentorship }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!mentorship?.id;

  const [f, setF] = useState<Mentorship>({
    title: mentorship?.title ?? '',
    slug: mentorship?.slug ?? '',
    description: mentorship?.description ?? '',
    format: mentorship?.format ?? '',
    cover_url: mentorship?.cover_url ?? null,
    published: mentorship?.published ?? false,
  });
  const [priceReais, setPriceReais] = useState(((mentorship?.price_cents ?? 0) / 100).toString());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Mentorship>(k: K, v: Mentorship[K]) { setF((p) => ({ ...p, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const payload = {
      title: f.title,
      slug: f.slug || slugify(f.title ?? ''),
      description: f.description || null,
      format: f.format || null,
      cover_url: f.cover_url || null,
      price_cents: Math.round(parseFloat(priceReais || '0') * 100) || 0,
      published: f.published,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from('mentorships').update(payload).eq('id', mentorship!.id);
        if (error) throw error;
        setMsg({ ok: true, text: 'Mentoria atualizada.' });
      } else {
        const { error } = await supabase.from('mentorships').insert(payload);
        if (error) throw error;
        setMsg({ ok: true, text: 'Mentoria criada.' });
        setF({ title: '', slug: '', description: '', format: '', cover_url: null, published: false });
        setPriceReais('0');
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
      <h2 className="font-serif text-xl text-cream">{isEdit ? 'Editar mentoria' : 'Nova mentoria'}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Título</label>
          <input className="input" value={f.title ?? ''} required
            onChange={(e) => { set('title', e.target.value); if (!isEdit) set('slug', slugify(e.target.value)); }} />
        </div>
        <div>
          <label className="label">Slug</label>
          <input className="input" value={f.slug ?? ''} required onChange={(e) => set('slug', e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ImageUpload
          label="Capa da mentoria"
          bucket="course-covers"
          prefix="mentorias"
          value={f.cover_url}
          onChange={(url) => set('cover_url', url)}
        />
        <div className="flex flex-col">
          <label className="label">Descrição</label>
          <textarea className="input min-h-28 flex-1" value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Formato</label>
          <input className="input" placeholder="individual / grupo / etc." value={f.format ?? ''} onChange={(e) => set('format', e.target.value)} />
        </div>
        <div>
          <label className="label">Preço (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={priceReais} onChange={(e) => setPriceReais(e.target.value)} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-cream/70">
        <input type="checkbox" checked={!!f.published} onChange={(e) => set('published', e.target.checked)} /> Publicado
      </label>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Salvar <Save size={16} /></>}</Button>
    </form>
  );
}
