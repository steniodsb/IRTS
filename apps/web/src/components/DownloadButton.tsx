'use client';
import { useState } from 'react';
import { Download, Loader2, Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function DownloadButton({
  libraryItemId, fileUrl, userId,
}: {
  libraryItemId: string;
  fileUrl: string | null;
  userId: string;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      await supabase.from('downloads').insert({ user_id: userId, library_item_id: libraryItemId });
    } catch {
      // registro de download é best-effort — não bloqueia o acesso ao arquivo.
    } finally {
      setLoading(false);
    }

    if (fileUrl) {
      window.open(fileUrl, '_blank', 'noopener,noreferrer');
      setDone(true);
      setTimeout(() => setDone(false), 3000);
    } else {
      alert('Arquivo indisponível no momento. Tente novamente mais tarde.');
    }
  }

  return (
    <button onClick={handleDownload} disabled={loading} className="btn-gold w-full">
      {loading ? (
        <><Loader2 size={16} className="animate-spin" /> Preparando…</>
      ) : done ? (
        <><Check size={16} /> Baixado</>
      ) : (
        <><Download size={16} /> Baixar</>
      )}
    </button>
  );
}
