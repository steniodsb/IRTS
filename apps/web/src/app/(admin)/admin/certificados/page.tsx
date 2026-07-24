import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { Card, EmptyState } from '@/components/ui';
import { RowActions } from '@/components/admin/RowActions';
import { IssueCertificateForm } from '@/components/admin/IssueCertificateForm';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@irts/shared';

export const metadata = { title: 'Certificados' };

export default async function AdminCertificadosPage() {
  const supabase = createClient();

  const [{ data: certificates }, { data: profiles }, { data: courses }] = await Promise.all([
    supabase
      .from('certificates')
      .select('id, code, issued_at, user_id, course_id, profiles(full_name), courses(title)')
      .order('issued_at', { ascending: false }),
    supabase.from('profiles').select('id, full_name').order('full_name'),
    supabase.from('courses').select('id, title').order('title'),
  ]);

  const list = (certificates ?? []) as any[];

  const students = ((profiles ?? []) as any[]).map((p) => ({
    id: p.id as string,
    label: (p.full_name as string | null) ?? 'Sem nome',
  }));
  const courseOptions = ((courses ?? []) as any[]).map((c) => ({
    id: c.id as string,
    label: c.title as string,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-cream">Certificados</h1>
        <p className="mt-1 text-cream/50">Emita e gerencie os certificados de conclusão dos alunos.</p>
      </div>

      <IssueCertificateForm students={students} courses={courseOptions} />

      {list.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line/60 text-left text-cream/50">
              <tr>
                <th className="px-5 py-3 font-medium">Aluno</th>
                <th className="px-5 py-3 font-medium">Curso</th>
                <th className="px-5 py-3 font-medium">Código</th>
                <th className="px-5 py-3 font-medium">Emitido em</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {list.map((c) => (
                <tr key={c.id} className="text-cream/80">
                  <td className="px-5 py-3 font-medium text-cream">{c.profiles?.full_name ?? 'Sem nome'}</td>
                  <td className="px-5 py-3">{c.courses?.title ?? '—'}</td>
                  <td className="px-5 py-3 font-mono text-xs text-cream/60">{c.code}</td>
                  <td className="px-5 py-3 text-cream/50">{formatDate(c.issued_at)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <Link
                        href={`/app/certificados/${c.code}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-gold hover:underline"
                        title="Ver certificado"
                      >
                        <ExternalLink size={15} /> Ver
                      </Link>
                      <RowActions table="certificates" id={c.id} label="o certificado" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState
          title="Nenhum certificado emitido"
          description="Os certificados emitidos automaticamente ou manualmente aparecerão aqui."
        />
      )}
    </div>
  );
}
