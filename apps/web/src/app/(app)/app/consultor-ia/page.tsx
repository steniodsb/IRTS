import { Bot } from 'lucide-react';
import { IAChat } from '@/components/IAChat';
import { MemberGate } from '@/components/MemberGate';
import { createClient } from '@/lib/supabase/server';
import { getMemberAccess } from '@/lib/access';

export const metadata = { title: 'Consultor IA' };

export default async function ConsultorIAPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isMember = await getMemberAccess(supabase, user?.id);

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col space-y-4">
      <div>
        <h1 className="flex items-center gap-2 font-serif text-3xl text-cream">
          <Bot size={26} className="text-gold" /> Consultor IA
        </h1>
        <p className="mt-1 text-cream/50">
          Tire dúvidas trabalhistas e sindicais com respostas fundamentadas na nossa base de conhecimento.
        </p>
      </div>

      {isMember ? (
        <IAChat />
      ) : (
        <MemberGate
          titulo="Assistente de IA — exclusivo para membros"
          descricao="IA especializada em negociações sindicais para consultas, pesquisas e apoio técnico."
        />
      )}
    </div>
  );
}
