import Link from 'next/link';
import { ArrowLeft, LineChart } from 'lucide-react';
import { SimuladorImpacto } from '@/components/tools/SimuladorImpacto';

export const metadata = { title: 'Simulador de impacto financeiro' };

export default function ImpactoPage() {
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
          <LineChart size={26} className="text-gold" /> Impacto financeiro da proposta
        </h1>
        <p className="mt-1 max-w-2xl text-cream/50">
          Monte a proposta cláusula por cláusula — percentuais sobre a folha e valores fixos por
          empregado — e veja o custo mensal, o custo anual e o peso sobre a massa salarial.
        </p>
      </div>

      <SimuladorImpacto />
    </div>
  );
}
