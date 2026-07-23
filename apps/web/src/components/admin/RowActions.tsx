'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, Eye, EyeOff, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Ações de linha reutilizáveis para as tabelas do admin:
 * alternar publicado/rascunho e excluir (com confirmação).
 */
export function RowActions({
  table,
  id,
  published,
  publishedColumn = 'published',
  label = 'este item',
  extraLink,
}: {
  table: string;
  id: string;
  published?: boolean;
  publishedColumn?: string;
  label?: string;
  extraLink?: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function togglePublish() {
    setBusy(true); setErr(null);
    const { error } = await supabase.from(table).update({ [publishedColumn]: !published }).eq('id', id);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Excluir ${label}? Esta ação não pode ser desfeita.`)) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from(table).delete().eq('id', id);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-end gap-3">
      {err && <span className="text-xs text-red-400">{err}</span>}
      {extraLink}
      {typeof published === 'boolean' && (
        <button onClick={togglePublish} disabled={busy}
          className="text-cream/50 hover:text-gold"
          title={published ? 'Despublicar' : 'Publicar'}>
          {busy ? <Loader2 size={16} className="animate-spin" /> : published ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
      <button onClick={remove} disabled={busy} className="text-cream/40 hover:text-red-400" title="Excluir">
        <Trash2 size={16} />
      </button>
    </div>
  );
}
