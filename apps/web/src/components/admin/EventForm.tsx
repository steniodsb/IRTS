'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { EVENT_TYPE_LABELS } from '@irts/shared';

const TYPES = Object.entries(EVENT_TYPE_LABELS) as [string, string][];

export function EventForm() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('live');
  const [startsAt, setStartsAt] = useState('');
  const [location, setLocation] = useState('');
  const [joinUrl, setJoinUrl] = useState('');
  const [description, setDescription] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!startsAt) { setMsg({ ok: false, text: 'Informe a data/hora de início.' }); return; }
    setSaving(true); setMsg(null);
    const { error } = await supabase.from('events').insert({
      title, type, starts_at: new Date(startsAt).toISOString(),
      location: location || null, join_url: joinUrl || null,
      description: description || null, published,
    });
    setSaving(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: 'Evento criado.' });
    setTitle(''); setStartsAt(''); setLocation(''); setJoinUrl(''); setDescription('');
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl text-cream">Novo evento</h2>
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
          <input className="input" value={location} placeholder="Online / endereço" onChange={(e) => setLocation(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="label">Link de acesso</label>
        <input className="input" value={joinUrl} placeholder="https://…" onChange={(e) => setJoinUrl(e.target.value)} />
      </div>
      <div>
        <label className="label">Descrição</label>
        <textarea className="input min-h-20" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-sm text-cream/70">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publicado
      </label>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Adicionar <Plus size={16} /></>}</Button>
    </form>
  );
}
