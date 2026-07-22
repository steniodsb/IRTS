'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Upload } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { LIBRARY_TYPE_LABELS } from '@irts/shared';

const TYPES = Object.entries(LIBRARY_TYPE_LABELS) as [string, string][];

export function LibraryForm() {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [type, setType] = useState('ebook');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isFree, setIsFree] = useState(false);
  const [published, setPublished] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload(file: File) {
    setUploading(true); setMsg(null);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage.from('library').upload(path, file, { upsert: false });
    setUploading(false);
    if (error) { setMsg({ ok: false, text: `Upload: ${error.message}` }); return; }
    setFileUrl(path);
    setMsg({ ok: true, text: `Arquivo enviado: ${path}` });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const isStoragePath = fileUrl && !/^https?:\/\//.test(fileUrl);
    const payload: any = {
      title, type, description: description || null, category: category || null,
      is_free: isFree, published,
      file_url: isStoragePath ? null : (fileUrl || null),
      storage_path: isStoragePath ? fileUrl : null,
    };
    const { error } = await supabase.from('library_items').insert(payload);
    setSaving(false);
    if (error) { setMsg({ ok: false, text: error.message }); return; }
    setMsg({ ok: true, text: 'Item criado.' });
    setTitle(''); setDescription(''); setCategory(''); setFileUrl('');
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl text-cream">Novo item</h2>
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
      <div>
        <label className="label">Descrição</label>
        <textarea className="input min-h-24" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Categoria</label>
          <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="label">URL do arquivo (ou faça upload)</label>
          <input className="input" value={fileUrl} placeholder="https://… ou caminho no bucket" onChange={(e) => setFileUrl(e.target.value)} />
        </div>
      </div>
      <div>
        <label className="btn-outline inline-flex cursor-pointer">
          <Upload size={16} /> {uploading ? 'Enviando…' : 'Enviar arquivo ao bucket "library"'}
          <input type="file" className="hidden" disabled={uploading}
            onChange={(e) => { const file = e.target.files?.[0]; if (file) upload(file); }} />
        </label>
      </div>
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-cream/70">
          <input type="checkbox" checked={isFree} onChange={(e) => setIsFree(e.target.checked)} /> Gratuito
        </label>
        <label className="flex items-center gap-2 text-sm text-cream/70">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Publicado
        </label>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Adicionar <Plus size={16} /></>}</Button>
    </form>
  );
}
