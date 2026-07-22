import { Bot } from 'lucide-react';
import { IAChat } from '@/components/IAChat';

export const metadata = { title: 'Consultor IA' };

export default function ConsultorIAPage() {
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
      <IAChat />
    </div>
  );
}
