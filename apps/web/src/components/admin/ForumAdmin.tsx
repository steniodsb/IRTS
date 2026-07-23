'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Pin, PinOff, Lock, LockOpen, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

/** Gestão das categorias do fórum (criar/excluir). */
export function CategoryManager({ categories }: { categories: { id: string; name: string; slug: string }[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('forum_categories').insert({
      name, slug: slugify(name), sort_order: categories.length,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setName(''); router.refresh();
  }

  async function remove(id: string) {
    if (!confirm('Excluir esta categoria? Os tópicos ficam sem categoria.')) return;
    const { error } = await supabase.from('forum_categories').delete().eq('id', id);
    if (error) { setErr(error.message); return; }
    router.refresh();
  }

  return (
    <div className="card p-5">
      <h2 className="font-serif text-lg text-cream">Categorias</h2>
      <form onSubmit={add} className="mt-3 flex gap-2">
        <input className="input" placeholder="Nova categoria" value={name} onChange={(e) => setName(e.target.value)} />
        <Button type="submit" disabled={busy}>{busy ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}</Button>
      </form>
      {err && <p className="mt-2 text-sm text-red-400">{err}</p>}
      <ul className="mt-4 space-y-2">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between rounded-lg border border-line/60 px-3 py-2 text-sm">
            <span className="text-cream/80">{c.name} <span className="text-cream/30">/{c.slug}</span></span>
            <button onClick={() => remove(c.id)} className="text-cream/40 hover:text-red-400"><Trash2 size={14} /></button>
          </li>
        ))}
        {categories.length === 0 && <li className="text-xs text-cream/40">Nenhuma categoria.</li>}
      </ul>
    </div>
  );
}

/** Ações de moderação de um tópico: fixar, travar, excluir. */
export function ThreadModActions({ thread }: { thread: { id: string; pinned: boolean; locked: boolean } }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);

  async function patch(fields: Record<string, unknown>) {
    setBusy(true);
    await supabase.from('forum_threads').update(fields).eq('id', thread.id);
    setBusy(false); router.refresh();
  }
  async function remove() {
    if (!confirm('Excluir este tópico e todas as respostas?')) return;
    setBusy(true);
    await supabase.from('forum_threads').delete().eq('id', thread.id);
    setBusy(false); router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {busy && <Loader2 size={14} className="animate-spin text-gold" />}
      <button onClick={() => patch({ pinned: !thread.pinned })} title={thread.pinned ? 'Desafixar' : 'Fixar'}
        className={thread.pinned ? 'text-gold' : 'text-cream/40 hover:text-gold'}>
        {thread.pinned ? <PinOff size={15} /> : <Pin size={15} />}
      </button>
      <button onClick={() => patch({ locked: !thread.locked })} title={thread.locked ? 'Destravar' : 'Travar'}
        className={thread.locked ? 'text-gold' : 'text-cream/40 hover:text-gold'}>
        {thread.locked ? <LockOpen size={15} /> : <Lock size={15} />}
      </button>
      <button onClick={remove} className="text-cream/40 hover:text-red-400" title="Excluir"><Trash2 size={15} /></button>
    </div>
  );
}
