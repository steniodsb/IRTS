'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

type Course = {
  id?: string;
  title?: string; slug?: string; subtitle?: string | null; description?: string | null;
  category?: string | null; level?: string | null; instructor?: string | null;
  price_cents?: number; is_free?: boolean; published?: boolean;
};

type Lesson = {
  id: string; module_id: string | null; title: string;
  video_provider: string; video_url: string | null; is_preview: boolean; sort_order: number;
};
type ModuleT = { id: string; title: string; sort_order: number };

function slugify(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export function CourseForm({
  course, modules = [], lessons = [],
}: { course?: Course; modules?: ModuleT[]; lessons?: Lesson[] }) {
  const router = useRouter();
  const supabase = createClient();
  const isEdit = !!course?.id;

  const [f, setF] = useState<Course>({
    title: course?.title ?? '',
    slug: course?.slug ?? '',
    subtitle: course?.subtitle ?? '',
    description: course?.description ?? '',
    category: course?.category ?? '',
    level: course?.level ?? 'iniciante',
    instructor: course?.instructor ?? '',
    price_cents: course?.price_cents ?? 0,
    is_free: course?.is_free ?? false,
    published: course?.published ?? false,
  });
  const [priceReais, setPriceReais] = useState(((course?.price_cents ?? 0) / 100).toString());
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function set<K extends keyof Course>(k: K, v: Course[K]) { setF((p) => ({ ...p, [k]: v })); }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setMsg(null);
    const payload = {
      title: f.title,
      slug: f.slug || slugify(f.title ?? ''),
      subtitle: f.subtitle || null,
      description: f.description || null,
      category: f.category || null,
      level: f.level || null,
      instructor: f.instructor || null,
      price_cents: Math.round(parseFloat(priceReais || '0') * 100) || 0,
      is_free: f.is_free,
      published: f.published,
    };
    try {
      if (isEdit) {
        const { error } = await supabase.from('courses').update(payload).eq('id', course!.id);
        if (error) throw error;
        setMsg({ ok: true, text: 'Curso atualizado.' });
      } else {
        const { data, error } = await supabase.from('courses').insert(payload).select('id').single();
        if (error) throw error;
        setMsg({ ok: true, text: 'Curso criado.' });
        router.push(`/admin/cursos/${data.id}`);
      }
      router.refresh();
    } catch (err: any) {
      setMsg({ ok: false, text: err.message ?? 'Erro ao salvar.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <form onSubmit={save} className="card space-y-4 p-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="label">Título</label>
            <input className="input" value={f.title ?? ''} required
              onChange={(e) => { set('title', e.target.value); if (!isEdit) set('slug', slugify(e.target.value)); }} />
          </div>
          <div>
            <label className="label">Slug</label>
            <input className="input" value={f.slug ?? ''} required onChange={(e) => set('slug', e.target.value)} />
          </div>
        </div>
        <div>
          <label className="label">Subtítulo</label>
          <input className="input" value={f.subtitle ?? ''} onChange={(e) => set('subtitle', e.target.value)} />
        </div>
        <div>
          <label className="label">Descrição</label>
          <textarea className="input min-h-28" value={f.description ?? ''} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Categoria</label>
            <input className="input" value={f.category ?? ''} onChange={(e) => set('category', e.target.value)} />
          </div>
          <div>
            <label className="label">Nível</label>
            <select className="input" value={f.level ?? 'iniciante'} onChange={(e) => set('level', e.target.value)}>
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
          <div>
            <label className="label">Instrutor</label>
            <input className="input" value={f.instructor ?? ''} onChange={(e) => set('instructor', e.target.value)} />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <label className="label">Preço (R$)</label>
            <input className="input" type="number" step="0.01" min="0" value={priceReais}
              disabled={f.is_free} onChange={(e) => setPriceReais(e.target.value)} />
          </div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-cream/70">
            <input type="checkbox" checked={!!f.is_free} onChange={(e) => set('is_free', e.target.checked)} /> Gratuito
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-cream/70">
            <input type="checkbox" checked={!!f.published} onChange={(e) => set('published', e.target.checked)} /> Publicado
          </label>
        </div>

        {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
        <Button type="submit" disabled={saving}>{saving ? 'Salvando…' : <>Salvar <Save size={16} /></>}</Button>
      </form>

      {isEdit && (
        <CourseCurriculum courseId={course!.id!} modules={modules} lessons={lessons} />
      )}
    </div>
  );
}

function CourseCurriculum({ courseId, modules, lessons }: { courseId: string; modules: ModuleT[]; lessons: Lesson[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // novo módulo
  const [modTitle, setModTitle] = useState('');

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!modTitle.trim()) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('modules').insert({
      course_id: courseId, title: modTitle, sort_order: modules.length,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setModTitle(''); router.refresh();
  }

  async function removeModule(id: string) {
    setBusy(true);
    await supabase.from('modules').delete().eq('id', id);
    setBusy(false); router.refresh();
  }

  const orphan = lessons.filter((l) => !l.module_id);

  return (
    <div className="space-y-5">
      <h2 className="font-serif text-2xl text-cream">Módulos e aulas</h2>

      <form onSubmit={addModule} className="flex gap-2">
        <input className="input" placeholder="Nome do novo módulo" value={modTitle} onChange={(e) => setModTitle(e.target.value)} />
        <Button type="submit" disabled={busy}>Adicionar módulo <Plus size={16} /></Button>
      </form>
      {err && <p className="text-sm text-red-400">{err}</p>}

      {modules.map((m) => (
        <div key={m.id} className="card p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-cream">{m.title}</h3>
            <button onClick={() => removeModule(m.id)} className="text-cream/40 hover:text-red-400" title="Excluir módulo"><Trash2 size={16} /></button>
          </div>
          <LessonList courseId={courseId} moduleId={m.id} lessons={lessons.filter((l) => l.module_id === m.id)} />
        </div>
      ))}

      <div className="card p-5">
        <h3 className="font-medium text-cream">Aulas sem módulo</h3>
        <LessonList courseId={courseId} moduleId={null} lessons={orphan} />
      </div>
    </div>
  );
}

function LessonList({ courseId, moduleId, lessons }: { courseId: string; moduleId: string | null; lessons: Lesson[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState('');
  const [provider, setProvider] = useState('youtube');
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function addLesson(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true); setErr(null);
    const { error } = await supabase.from('lessons').insert({
      course_id: courseId, module_id: moduleId, title,
      video_provider: provider, video_url: url || null,
      is_preview: preview, sort_order: lessons.length, published: true,
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setTitle(''); setUrl(''); setPreview(false); router.refresh();
  }

  async function removeLesson(id: string) {
    await supabase.from('lessons').delete().eq('id', id);
    router.refresh();
  }

  return (
    <div className="mt-3 space-y-2">
      {lessons.map((l) => (
        <div key={l.id} className="flex items-center justify-between rounded-lg border border-line/60 px-3 py-2 text-sm">
          <span className="text-cream/80">
            {l.sort_order + 1}. {l.title}
            {l.is_preview && <span className="ml-2 text-xs text-gold">amostra</span>}
          </span>
          <button onClick={() => removeLesson(l.id)} className="text-cream/40 hover:text-red-400"><Trash2 size={14} /></button>
        </div>
      ))}
      {lessons.length === 0 && <p className="text-xs text-cream/40">Nenhuma aula ainda.</p>}

      <form onSubmit={addLesson} className="mt-3 grid gap-2 border-t border-line/60 pt-3 md:grid-cols-[1fr_140px_1fr_auto]">
        <input className="input" placeholder="Título da aula" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select className="input" value={provider} onChange={(e) => setProvider(e.target.value)}>
          <option value="youtube">YouTube</option>
          <option value="vimeo">Vimeo</option>
          <option value="mux">Mux</option>
          <option value="upload">Upload</option>
          <option value="external">Externo</option>
        </select>
        <input className="input" placeholder="URL do vídeo" value={url} onChange={(e) => setUrl(e.target.value)} />
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1 whitespace-nowrap text-xs text-cream/60">
            <input type="checkbox" checked={preview} onChange={(e) => setPreview(e.target.checked)} /> amostra
          </label>
          <Button type="submit" variant="outline" disabled={busy}><Plus size={16} /></Button>
        </div>
      </form>
      {err && <p className="text-sm text-red-400">{err}</p>}
    </div>
  );
}
