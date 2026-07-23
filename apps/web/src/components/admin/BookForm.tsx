'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { createClient } from '@/lib/supabase/client';

type Book = {
  id?: string;
  title?: string; slug?: string; author?: string | null; description?: string | null;
  cover_url?: string | null; price_cents?: number; stock?: number;
  weight_grams?: number | null; pages?: number | null; published?: boolean;
};

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function BookForm({ book }: { book?: Book }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!book?.id;

  const [f, setF] = useState<Book>({
    title: book?.title ?? '',
    slug: book?.slug ?? '',
    author: book?.author ?? '',
    description: book?.description ?? '',
    cover_url: book?.cover_url ?? null,
    stock: book?.stock ?? 0,
    weight_grams: book?.weight_grams ?? 500,
    pages: book?.pages ?? undefined,
    published: book?.published ?? false,
  });
  const [priceReais, setPriceReais] = useState(((book?.price_cents ?? 0) / 100).toString());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Book>(k: K, v: Book[K]) { setF((p) => ({ ...p, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const payload = {
      title: f.title,
      slug: f.slug || slugify(f.title ?? ''),
      author: f.author || null,
      description: f.description || null,
      cover_url: f.cover_url || null,
      price_cents: Math.round(parseFloat(priceReais || '0') * 100) || 0,
      stock: Number(f.stock) || 0,
      weight_grams: f.weight_grams != null ? Number(f.weight_grams) : null,
      pages: f.pages ? Number(f.pages) : null,
      published: f.published,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from('books').update(payload).eq('id', book!.id);
        if (error) throw error;
        setMsg({ ok: true, text: 'Livro atualizado.' });
      } else {
        const { error } = await supabase.from('books').insert(payload);
        if (error) throw error;
        setMsg({ ok: true, text: 'Livro criado.' });
        setF({ title: '', slug: '', author: '', description: '', cover_url: null, stock: 0, weight_grams: 500, pages: undefined, published: false });
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
      <h2 className="font-serif text-xl text-cream">{isEdit ? 'Editar livro' : 'Novo livro'}</h2>
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
      <div>
        <label className="label">Autor</label>
        <input className="input" value={f.author ?? ''} onChange={(e) => set('author', e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <ImageUpload
          label="Capa do livro"
          bucket="course-covers"
          prefix="livros"
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
          <label className="label">Preço (R$)</label>
          <input className="input" type="number" step="0.01" min="0" value={priceReais} onChange={(e) => setPriceReais(e.target.value)} />
        </div>
        <div>
          <label className="label">Estoque</label>
          <input className="input" type="number" step="1" min="0" value={f.stock ?? 0} onChange={(e) => set('stock', Number(e.target.value))} />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Peso (g) — para frete Correios</label>
          <input className="input" type="number" step="1" min="0" value={f.weight_grams ?? ''} onChange={(e) => set('weight_grams', e.target.value === '' ? null : Number(e.target.value))} />
        </div>
        <div>
          <label className="label">Páginas (opcional)</label>
          <input className="input" type="number" step="1" min="0" value={f.pages ?? ''} onChange={(e) => set('pages', e.target.value === '' ? undefined : Number(e.target.value))} />
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
