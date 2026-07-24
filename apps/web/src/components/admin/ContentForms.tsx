'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { createClient } from '@/lib/supabase/client';

function useSaver(table: string, reset: () => void) {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  async function insert(payload: any) {
    setSaving(true); setMsg(null);
    const { error } = await supabase.from(table).insert(payload);
    setSaving(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: 'Publicado.' });
    reset(); router.refresh();
  }
  return { saving, msg, insert };
}

export function NewsForm() {
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [url, setUrl] = useState('');
  const [source, setSource] = useState('');
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const { saving, msg, insert } = useSaver('news', () => { setTitle(''); setSummary(''); setUrl(''); setSource(''); setCoverUrl(null); });
  return (
    <form onSubmit={(e) => { e.preventDefault(); insert({ title, summary: summary || null, url: url || null, source: source || null, cover_url: coverUrl || null }); }}
      className="card space-y-3 p-6">
      <h3 className="font-serif text-lg text-cream">Nova notícia</h3>
      <input className="input" placeholder="Título" value={title} required onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input min-h-20" placeholder="Resumo" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <input className="input" placeholder="URL (opcional)" value={url} onChange={(e) => setUrl(e.target.value)} />
      <input className="input" placeholder="Fonte (opcional)" value={source} onChange={(e) => setSource(e.target.value)} />
      <ImageUpload bucket="public-assets" prefix="noticias" label="Imagem da notícia" value={coverUrl} onChange={setCoverUrl} />
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Publicar <Plus size={16} /></>}</Button>
    </form>
  );
}

export function AnnouncementForm() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [level, setLevel] = useState('info');
  const { saving, msg, insert } = useSaver('announcements', () => { setTitle(''); setBody(''); setLevel('info'); });
  return (
    <form onSubmit={(e) => { e.preventDefault(); insert({ title, body: body || null, level }); }}
      className="card space-y-3 p-6">
      <h3 className="font-serif text-lg text-cream">Novo aviso</h3>
      <input className="input" placeholder="Título" value={title} required onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input min-h-20" placeholder="Mensagem" value={body} onChange={(e) => setBody(e.target.value)} />
      <select className="input" value={level} onChange={(e) => setLevel(e.target.value)}>
        <option value="info">Informação</option>
        <option value="success">Sucesso</option>
        <option value="warning">Atenção</option>
      </select>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Publicar <Plus size={16} /></>}</Button>
    </form>
  );
}

export function UpdateForm() {
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { saving, msg, insert } = useSaver('platform_updates', () => { setVersion(''); setTitle(''); setBody(''); });
  return (
    <form onSubmit={(e) => { e.preventDefault(); insert({ version: version || null, title, body: body || null }); }}
      className="card space-y-3 p-6">
      <h3 className="font-serif text-lg text-cream">Nova atualização</h3>
      <input className="input" placeholder="Versão (ex.: 1.2.0)" value={version} onChange={(e) => setVersion(e.target.value)} />
      <input className="input" placeholder="Título" value={title} required onChange={(e) => setTitle(e.target.value)} />
      <textarea className="input min-h-20" placeholder="O que mudou" value={body} onChange={(e) => setBody(e.target.value)} />
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Publicar <Plus size={16} /></>}</Button>
    </form>
  );
}
