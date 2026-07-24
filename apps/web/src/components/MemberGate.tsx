import { Lock, Check } from 'lucide-react';
import { LinkButton } from '@/components/ui';

/**
 * Bloco exibido quando o usuário não tem acesso de membro
 * (sem assinatura ativa e sem compra de curso nos últimos 6 meses).
 */
export function MemberGate({
  titulo = 'Conteúdo exclusivo para membros',
  descricao = 'Assine um plano para desbloquear esta área.',
  beneficios = [
    'Hub de Inteligência e casos práticos',
    'Biblioteca completa (ACTs, CCTs, modelos e checklists)',
    'Ferramentas: calculadoras, simuladores e matrizes',
    'Assistente de IA especializado',
    'Alertas inteligentes',
  ],
}: {
  titulo?: string;
  descricao?: string;
  beneficios?: string[];
}) {
  return (
    <div className="card mx-auto max-w-2xl p-10 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
        <Lock size={26} />
      </span>
      <h2 className="mt-5 font-serif text-2xl text-cream">{titulo}</h2>
      <p className="mt-2 text-cream/60">{descricao}</p>

      <ul className="mx-auto mt-6 max-w-md space-y-2 text-left">
        {beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-cream/70">
            <Check size={16} className="mt-0.5 shrink-0 text-gold" /> {b}
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <LinkButton href="/planos" variant="gold">Ver planos</LinkButton>
        <LinkButton href="/guias" variant="outline">Materiais gratuitos</LinkButton>
      </div>

      <p className="mt-5 text-xs text-cream/40">
        Alunos de cursos mantêm o acesso por 6 meses após a compra.
      </p>
    </div>
  );
}
