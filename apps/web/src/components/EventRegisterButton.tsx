'use client';
import { useState } from 'react';
import { Check, Loader2, LogIn, CalendarPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function EventRegisterButton({
  eventId, userId, joinUrl, registered,
}: {
  eventId: string;
  userId: string;
  joinUrl: string | null;
  registered: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(registered);
  const [loading, setLoading] = useState(false);

  async function register() {
    setLoading(true);
    const { error } = await supabase
      .from('event_registrations')
      .upsert({ event_id: eventId, user_id: userId }, { onConflict: 'event_id,user_id' });
    setLoading(false);
    if (!error) {
      setIsRegistered(true);
      router.refresh();
    }
  }

  // Já inscrito: se houver link, mostra "Entrar"; senão confirma inscrição.
  if (isRegistered) {
    if (joinUrl) {
      return (
        <a href={joinUrl} target="_blank" rel="noreferrer" className="btn-gold whitespace-nowrap">
          <LogIn size={16} /> Entrar
        </a>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-500/40 px-4 py-2.5 text-sm text-emerald-400">
        <Check size={16} /> Inscrito
      </span>
    );
  }

  return (
    <button onClick={register} disabled={loading} className="btn-outline whitespace-nowrap">
      {loading ? <Loader2 size={16} className="animate-spin" /> : <CalendarPlus size={16} />}
      Inscrever-se
    </button>
  );
}
