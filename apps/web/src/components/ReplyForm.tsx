'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function ReplyForm({ threadId, userId }: { threadId: string; userId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError(null);

    const { error: err } = await supabase
      .from('forum_posts')
      .insert({ thread_id: threadId, user_id: userId, body: body.trim() });

    setLoading(false);
    if (err) {
      setError('Não foi possível enviar sua resposta. Tente novamente.');
      return;
    }
    setBody('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <label className="label">Sua resposta</label>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Compartilhe sua contribuição…"
        className="input resize-none"
        required
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={loading || !body.trim()} className="btn-gold">
          {loading ? <><Loader2 size={16} className="animate-spin" /> Enviando…</> : <><Send size={16} /> Responder</>}
        </button>
      </div>
    </form>
  );
}
