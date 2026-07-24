'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award } from 'lucide-react';
import { Button } from '@/components/ui';
import { createClient } from '@/lib/supabase/client';

type Option = { id: string; label: string };

/**
 * Emissão manual de certificado: escolhe aluno + curso e insere em `certificates`.
 * O `code` é gerado por default no banco.
 */
export function IssueCertificateForm({
  students,
  courses,
}: {
  students: Option[];
  courses: Option[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [userId, setUserId] = useState('');
  const [courseId, setCourseId] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !courseId) return;
    setSaving(true); setMsg(null);
    const { error } = await supabase
      .from('certificates')
      .insert({ user_id: userId, course_id: courseId });
    setSaving(false);
    if (error) {
      const dup = error.code === '23505' || /duplicate key|unique/i.test(error.message ?? '');
      setMsg({
        ok: false,
        text: dup ? 'Este aluno já possui certificado deste curso.' : (error.message ?? 'Erro ao emitir certificado.'),
      });
      return;
    }
    setMsg({ ok: true, text: 'Certificado emitido.' });
    setUserId(''); setCourseId('');
    router.refresh();
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <h2 className="font-serif text-xl text-cream">Emitir certificado</h2>
      <p className="text-sm text-cream/50">
        Emita manualmente um certificado de conclusão para um aluno.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="label">Aluno</label>
          <select className="input" value={userId} required onChange={(e) => setUserId(e.target.value)}>
            <option value="">Selecione o aluno…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Curso</label>
          <select className="input" value={courseId} required onChange={(e) => setCourseId(e.target.value)}>
            <option value="">Selecione o curso…</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>
      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}
      <Button type="submit" disabled={saving || !userId || !courseId}>
        {saving ? 'Emitindo…' : <>Emitir certificado <Award size={16} /></>}
      </Button>
    </form>
  );
}
