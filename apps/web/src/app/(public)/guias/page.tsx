import { FileText, Download } from 'lucide-react';
import { SectionTitle, Card, Badge, EmptyState, LinkButton } from '@/components/ui';
import { createClient } from '@/lib/supabase/server';
import { LIBRARY_TYPE_LABELS, type LibraryType } from '@irts/shared';

export const metadata = { title: 'Guias Estratégicos' };

export default async function GuiasPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from('library_items')
    .select('*')
    .eq('published', true)
    .eq('is_free', true)
    .order('created_at', { ascending: false });

  const list = (items ?? []) as any[];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <SectionTitle
        center
        overline="Acesso livre"
        title="Guias Estratégicos"
        subtitle="Materiais práticos sobre negociações coletivas, desenvolvidos por quem atua há mais de 30 anos na área. Acesso livre."
      />

      {list.length > 0 ? (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((item) => (
            <Card key={item.id} className="flex h-full flex-col">
              <div className="mb-3">
                <Badge tone="gold">{LIBRARY_TYPE_LABELS[item.type as LibraryType] ?? item.type}</Badge>
              </div>

              <div className="mb-2 flex items-start gap-2">
                <FileText size={18} className="mt-0.5 shrink-0 text-cream/40" />
                <p className="font-medium text-cream">{item.title}</p>
              </div>

              {item.description && <p className="text-sm text-cream/55">{item.description}</p>}
              {item.category && <p className="mt-2 text-xs text-cream/40">{item.category}</p>}

              <div className="mt-4 flex-1" />

              {item.file_url ? (
                <a href={item.file_url} target="_blank" rel="noreferrer" className="btn-gold w-full">
                  <Download size={16} /> Baixar
                </a>
              ) : (
                <button type="button" disabled className="btn-gold w-full">
                  Em breve
                </button>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <div className="mt-10">
          <EmptyState
            title="Nenhum guia disponível ainda"
            description="Os materiais de acesso livre serão publicados aqui em breve."
          />
        </div>
      )}

      <div className="card mt-12 flex flex-col items-center gap-4 p-8 text-center">
        <h2 className="font-serif text-2xl text-cream">Quer o acervo completo?</h2>
        <p className="max-w-2xl text-cream/60">
          A Biblioteca técnica completa, o Hub de conteúdo, as Ferramentas de negociação e o
          Assistente de IA são exclusivos para membros. Crie sua conta e comece agora.
        </p>
        <LinkButton href="/cadastro" variant="gold">Criar conta</LinkButton>
      </div>
    </section>
  );
}
