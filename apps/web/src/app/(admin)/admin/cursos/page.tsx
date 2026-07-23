import Link from 'next/link';
import { Plus, Pencil, ExternalLink } from 'lucide-react';
import { Card, Badge, EmptyState, LinkButton } from '@/components/ui';
import { RowActions } from '@/components/admin/RowActions';
import { createClient } from '@/lib/supabase/server';
import { formatBRL } from '@irts/shared';

export const metadata = { title: 'Cursos' };

export default async function AdminCursosPage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from('courses').select('*').order('sort_order');

  const list = (courses ?? []) as any[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl text-cream">Cursos</h1>
          <p className="mt-1 text-cream/50">Gerencie os cursos, módulos e aulas.</p>
        </div>
        <LinkButton href="/admin/cursos/novo" variant="gold">Novo curso <Plus size={16} /></LinkButton>
      </div>

      {list.length > 0 ? (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line/60 text-left text-cream/50">
              <tr>
                <th className="px-5 py-3 font-medium">Título</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Preço</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line/60">
              {list.map((c) => (
                <tr key={c.id} className="text-cream/80">
                  <td className="px-5 py-3">
                    <p className="font-medium text-cream">{c.title}</p>
                    <p className="text-xs text-cream/40">/{c.slug}</p>
                  </td>
                  <td className="px-5 py-3">{c.category ?? '—'}</td>
                  <td className="px-5 py-3">{c.is_free ? 'Gratuito' : c.price_cents ? formatBRL(c.price_cents) : 'Plano'}</td>
                  <td className="px-5 py-3">
                    {c.published ? <Badge tone="success">Publicado</Badge> : <Badge>Rascunho</Badge>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      {c.published && (
                        <Link href={`/cursos/${c.slug}`} target="_blank" className="text-cream/50 hover:text-gold" title="Ver no site"><ExternalLink size={16} /></Link>
                      )}
                      <Link href={`/admin/cursos/${c.id}`} className="inline-flex items-center gap-1 text-gold hover:underline"><Pencil size={15} /> Editar</Link>
                      <RowActions table="courses" id={c.id} published={c.published} label="o curso" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ) : (
        <EmptyState
          title="Nenhum curso ainda"
          description="Crie o primeiro curso da plataforma."
          action={<LinkButton href="/admin/cursos/novo" variant="gold">Novo curso</LinkButton>}
        />
      )}
    </div>
  );
}
