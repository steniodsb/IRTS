import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CourseForm } from '@/components/admin/CourseForm';

export const metadata = { title: 'Novo curso' };

export default function NovoCursoPage() {
  return (
    <div className="space-y-6">
      <Link href="/admin/cursos" className="inline-flex items-center gap-1.5 text-sm text-cream/50 hover:text-gold">
        <ArrowLeft size={16} /> Voltar
      </Link>
      <h1 className="font-serif text-3xl text-cream">Novo curso</h1>
      <CourseForm />
    </div>
  );
}
