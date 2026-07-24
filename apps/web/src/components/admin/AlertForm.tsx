'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';
import { ALERT_CATEGORY_LABELS, ALERT_SEVERITY_LABELS } from '@/lib/alerts';

const CATEGORIES = Object.entries(ALERT_CATEGORY_LABELS) as [string, string][];
const SEVERITIES = Object.entries(ALERT_SEVERITY_LABELS) as [string, string][];

type AlertItem = {
  id?: string;
  title?: string;
  body?: string | null;
  category?: string | null;
  severity?: string | null;
  url?: string | null;
  source?: string | null;
  published?: boolean;
};

export function AlertForm({ alert }: { alert?: AlertItem }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!alert?.id;

  const [title, setTitle] = useState(alert?.title ?? '');
  const [body, setBody] = useState(alert?.body ?? '');
  const [category, setCategory] = useState(alert?.category ?? 'convencao');
  const [severity, setSeverity] = useState(alert?.severity ?? 'info');
  const [url, setUrl] = useState(alert?.url ?? '');
  const [source, setSource] = useState(alert?.source ?? '');
  const [published, setPublished] = useState(alert?.published ?? true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) { setMsg({ ok: false, text: 'Informe o título do alerta.' }); return; }
    setSaving(true); setMsg(null);
    const payload = {
      title: title.trim(),
      body: body || null,
      category: category || null,
      severity,
      url: url || null,
      source: source || null,
      published,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from('alerts').update(payload).eq('id', alert!.id);
        if (error) throw error;
        setMsg({ ok: true, text: 'Alerta atualizado.' });
      } else {
        const { error } = await supabase.from('alerts').insert(payload);
        if (error) throw error;
        setMsg({ ok: true, text: 'Alerta criado.' });
        setTitle(''); setBody(''); setUrl(''); setSource('');
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
      <h2 className="font-serif text-xl text-cream">{isEdit ? 'Editar alerta' : 'Novo alerta'}</h2>

      <div>
        <label className="label">Título</label>
        <input className="input" value={title} required onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div>
        <label className="label">Conteúdo</label>
        <textarea
          className="input min-h-24"
          value={body ?? ''}
          placeholder="Resumo do que mudou e o impacto prático para a negociação."
          onChange={(e) => setBody(e.target.value)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Categoria</label>
          <select className="input" value={category ?? 'outro'} onChange={(e) => setCategory(e.target.value)}>
            {CATEGORIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Severidade</label>
          <select className="input" value={severity ?? 'info'} onChange={(e) => setSeverity(e.target.value)}>
            {SEVERITIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Link da fonte</label>
          <input className="input" value={url ?? ''} placeholder="https://…" onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div>
          <label className="label">Fonte</label>
          <input className="input" value={source ?? ''} placeholder="TST, DOU, MTE…" onChange={(e) => setSource(e.target.value)} />
        </div>
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
