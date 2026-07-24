import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { CalcBancoHoras } from '@/components/tools/CalcBancoHoras';

export const metadata = { title: 'Calculadora de banco de horas' };

export default function BancoDeHorasPage() {
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
          <Clock size={26} className="text-gold" /> Banco de horas
        </h1>
        <p className="mt-1 max-w-2xl text-cream/50">
          Apure o saldo de horas, o prazo final de compensação previsto no acordo e quanto custaria
          se esse saldo for pago como hora extra.
        </p>
      </div>

      <CalcBancoHoras />
    </div>
  );
}
