import Link from 'next/link';
import { ArrowLeft, Calculator } from 'lucide-react';
import { CalcReajuste } from '@/components/tools/CalcReajuste';

export const metadata = { title: 'Calculadora de reajuste salarial' };

export default function ReajustePage() {
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
          <Calculator size={26} className="text-gold" /> Reajuste salarial
        </h1>
        <p className="mt-1 max-w-2xl text-cream/50">
          Combine o índice do período (INPC/IPCA) com o ganho real pretendido e veja o reajuste
          composto, o novo custo da folha e o impacto anual em 13 meses — com e sem encargos.
        </p>
      </div>

      <CalcReajuste />
    </div>
  );
}
