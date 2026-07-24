import Link from 'next/link';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import { CronogramaDataBase } from '@/components/tools/CronogramaDataBase';

export const metadata = { title: 'Cronograma da data-base' };

export default function CronogramaPage() {
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
          <CalendarClock size={26} className="text-gold" /> Cronograma da data-base
        </h1>
        <p className="mt-1 max-w-2xl text-cream/50">
          Informe a data-base da categoria e receba o calendário completo da negociação — da
          preparação ao registro do instrumento coletivo — com a contagem de dias de cada marco.
        </p>
      </div>

      <CronogramaDataBase />
    </div>
  );
}
