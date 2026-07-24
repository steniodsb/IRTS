import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { PrintButton } from '@/components/PrintButton';
import { formatDate } from '@irts/shared';

export const metadata = { title: 'Certificado' };

export default async function CertificadoPage({ params }: { params: { code: string } }) {
  const supabase = createClient();

  // RLS garante que só o dono do certificado (ou um admin) consegue ler.
  const { data: cert } = await supabase
    .from('certificates')
    .select('*, courses(title, instructor, duration_minutes)')
    .eq('code', params.code)
    .maybeSingle();

  if (!cert) notFound();

  const { data: profile } = await supabase
    .from('profiles').select('full_name').eq('id', (cert as any).user_id).maybeSingle();

  const course = (cert as any).courses;
  const studentName = profile?.full_name ?? 'Aluno(a)';

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between no-print">
        <Link href="/app/cursos" className="inline-flex items-center gap-1.5 text-sm text-cream/60 hover:text-gold">
          <ArrowLeft size={16} /> Meus cursos
        </Link>
        <PrintButton />
      </div>

      {/* Área imprimível */}
      <div className="print-area">
        <div className="relative overflow-hidden rounded-2xl border-4 border-double border-gold/60 bg-ink p-10 md:p-16 text-center print:rounded-none print:border-gold">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.12),transparent_60%)]" />
          <div className="relative">
            <p className="font-serif text-2xl tracking-[0.25em] text-gold">IRTS</p>
            <p className="mt-1 text-xs uppercase tracking-[0.3em] text-cream/50">Inteligência em Relações Trabalhistas e Sindicais</p>

            <p className="mt-12 text-sm uppercase tracking-[0.25em] text-cream/50">Certificado de conclusão</p>
            <h1 className="mt-6 font-serif text-4xl text-cream md:text-5xl">{studentName}</h1>
            <p className="mx-auto mt-6 max-w-xl text-cream/70">
              concluiu com aproveitamento o curso
            </p>
            <p className="mt-3 font-serif text-2xl text-gold">{course?.title ?? 'Curso'}</p>
            {course?.duration_minutes ? (
              <p className="mt-2 text-sm text-cream/50">Carga horária: {Math.round(course.duration_minutes / 60)}h</p>
            ) : null}

            <div className="mt-14 flex flex-col items-center justify-between gap-6 sm:flex-row">
              <div className="text-center">
                <div className="mx-auto w-52 border-t border-cream/40" />
                <p className="mt-2 text-sm text-cream/70">{course?.instructor ?? 'Newton dos Anjos'}</p>
                <p className="text-xs text-cream/40">Instrutor</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-cream/70">{formatDate(cert.issued_at)}</p>
                <p className="text-xs text-cream/40">Data de emissão</p>
              </div>
            </div>

            <p className="mt-10 text-xs text-cream/40">
              Código de verificação: <span className="font-mono text-cream/60">{cert.code}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
