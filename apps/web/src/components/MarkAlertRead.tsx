'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, CheckCheck, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/** Marca um alerta como lido para o usuário atual (upsert em `alert_reads`). */
export function MarkAlertRead({ alertId, userId }: { alertId: string; userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function mark() {
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from('alert_reads')
      .upsert({ alert_id: alertId, user_id: userId }, { onConflict: 'alert_id,user_id' });
    setBusy(false);
    if (error) { setErr('Não foi possível marcar.'); return; }
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-2">
      {err && <span className="text-xs text-red-400">{err}</span>}
      <button onClick={mark} disabled={busy} className="inline-flex items-center gap-1 text-xs text-gold hover:underline">
        {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Marcar como lido
      </button>
    </div>
  );
}

/** Marca todos os alertas visíveis como lidos de uma vez. */
export function MarkAllAlertsRead({ alertIds, userId }: { alertIds: string[]; userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function markAll() {
    if (alertIds.length === 0) return;
    setBusy(true);
    setErr(null);
    const { error } = await supabase
      .from('alert_reads')
      .upsert(
        alertIds.map((alert_id) => ({ alert_id, user_id: userId })),
        { onConflict: 'alert_id,user_id' },
      );
    setBusy(false);
    if (error) { setErr('Não foi possível marcar todos.'); return; }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {err && <span className="text-xs text-red-400">{err}</span>}
      <button onClick={markAll} disabled={busy} className="btn-ghost text-sm">
        {busy ? <><Loader2 size={16} className="animate-spin" /> Marcando…</> : <><CheckCheck size={16} /> Marcar todos como lidos</>}
      </button>
    </div>
  );
}
