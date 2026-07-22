import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { CourseForm } from '@/components/admin/CourseForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Editar curso' };

export default async function EditCursoPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: course } = await supabase.from('courses').select('*').eq('id', params.id).maybeSingle();
  if (!course) notFound();

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase.from('modules').select('*').eq('course_id', course.id).order('sort_order'),
    supabase.from('lessons').select('*').eq('course_id', course.id).order('sort_order'),
  ]);

  return (
    <div className="space-y-6">
      <Link href="/admin/cursos" className="inline-flex items-center gap-1.5 text-sm text-cream/50 hover:text-gold">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="font-serif text-3xl text-cream">Editar curso</h1>
      <CourseForm course={course} modules={(modules ?? []) as any} lessons={(lessons ?? []) as any} />
    </div>
  );
}
