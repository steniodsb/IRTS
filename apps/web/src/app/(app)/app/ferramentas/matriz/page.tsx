import Link from 'next/link';
import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { MatrizNegociacao } from '@/components/tools/MatrizNegociacao';

export const metadata = { title: 'Matriz de negociação' };

export default function MatrizPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/ferramentas"
          className="inline-flex items-center gap-1.5 text-sm text-cream/50 transition hover:text-gold"
        >
          <ArrowLeft size={15} /> Ferramentas
        </Link>

        <h1 className="mt-3 flex items-center gap-2 font-serif text-3xl text-cream">
          <LayoutGrid size={26} className="text-gold" /> Matriz de negociação
        </h1>
        <p className="mt-1 max-w-2xl text-cream/50">
          Classifique cada cláusula por impacto financeiro e relevância sindical. A matriz calcula o
          score, ordena por prioridade e sugere o que segurar, o que negociar e o que ceder.
        </p>
      </div>

      <MatrizNegociacao />
    </div>
  );
}
