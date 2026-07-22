'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Category = { id: string; name: string };

export function NewThreadForm({ categories, userId }: { categories: Category[]; userId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setLoading(true);
    setError(null);

    const { data, error: err } = await supabase
      .from('forum_threads')
      .insert({
        user_id: userId,
        category_id: categoryId || null,
        title: title.trim(),
        body: body.trim(),
      })
      .select('id')
      .single();

    setLoading(false);
    if (err) {
      setError('Não foi possível criar o tópico. Tente novamente.');
      return;
    }
    setOpen(false);
    setTitle('');
    setBody('');
    router.push(`/app/comunidade/${data.id}`);
    router.refresh();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-gold">
        <Plus size={16} /> Novo tópico
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <form
            onSubmit={submit}
            className="card relative z-10 w-full max-w-lg space-y-4 p-6"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl text-cream">Novo tópico</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-cream/50 hover:text-cream">
                <X size={20} />
              </button>
            </div>

            {categories.length > 0 && (
              <div>
                <label className="label">Categoria</label>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Sobre o que você quer falar?"
                className="input"
                required
              />
            </div>

            <div>
              <label className="label">Mensagem</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Escreva os detalhes…"
                className="input resize-none"
                required
              />
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} className="btn-ghost">Cancelar</button>
              <button type="submit" disabled={loading} className="btn-gold">
                {loading ? <><Loader2 size={16} className="animate-spin" /> Publicando…</> : 'Publicar tópico'}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
