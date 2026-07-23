'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { EVENT_TYPE_LABELS } from '@irts/shared';

const TYPES = Object.entries(EVENT_TYPE_LABELS) as [string, string][];

type EventItem = {
  id?: string;
  title?: string;
  type?: string;
  starts_at?: string | null;
  location?: string | null;
  join_url?: string | null;
  description?: string | null;
  published?: boolean;
};

/** Converte ISO para o formato aceito por <input type="datetime-local"> (hora local). */
function toLocalInput(iso?: string | null) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function EventForm({ event }: { event?: EventItem }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!event?.id;

  const [title, setTitle] = useState(event?.title ?? '');
  const [type, setType] = useState(event?.type ?? 'live');
  const [startsAt, setStartsAt] = useState(toLocalInput(event?.starts_at));
  const [location, setLocation] = useState(event?.location ?? '');
  const [joinUrl, setJoinUrl] = useState(event?.join_url ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [published, setPublished] = useState(event?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) { setMsg({ ok: false, text: 'Informe a data/hora de início.' }); return; }
    setSaving(true); setMsg(null);
    const payload = {
      title, type, starts_at: new Date(startsAt).toISOString(),
      location: location || null, join_url: joinUrl || null,
      description: description || null, published,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from('events').update(payload).eq('id', event!.id);
        if (error) throw error;
        setMsg({ ok: true, text: 'Evento atualizado.' });
      } else {
        const { error } = await supabase.from('events').insert(payload);
        if (error) throw error;
        setMsg({ ok: true, text: 'Evento criado.' });
        setTitle(''); setStartsAt(''); setLocation(''); setJoinUrl(''); setDescription('');
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
      <h2 className="font-serif text-xl text-cream">{isEdit ? 'Editar evento' : 'Novo evento'}</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Título</label>
          <input className="input" value={title} required onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Tipo</label>
          <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Início</label>
          <input className="input" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} required />
        </div>
        <div>
          <label className="label">Local</label>
          <input className="input" value={location ?? ''} placeholder="Online / endereço" onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Link de acesso</label>
        <input className="input" value={joinUrl ?? ''} placeholder="https://…" onChange={(e) => setJoinUrl(e.target.value)} />
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea className="input min-h-20" value={description ?? ''} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-cream/70">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publicado
      </label>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? 'Salvando…' : isEdit ? <>Salvar <Save size={16} /></> : <>Adicionar <Plus size={16} /></>}
      </Button>
    </form>
  );
}
