'use client';
import { useEffect, useRef, useState } from 'react';
import { Send, Bot, User as UserIcon, Loader2, FileText, Sparkles } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { AiCitation } from '@irts/shared';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  citations?: AiCitation[];
};

const EXAMPLES = [
  'Como devo responder a uma pauta sindical sobre banco de horas?',
  'Quais os prazos para homologação de rescisão?',
  'O que muda com a reforma trabalhista no acordo individual?',
  'Como estruturar uma negociação de PLR com o sindicato?',
];

export function IAChat() {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setError(null);
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Faça login novamente.');

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/consultor-ia`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ question: q, conversation_id: conversationId }),
        },
      );

      if (!res.ok) throw new Error(`Não foi possível obter a resposta (${res.status}).`);

      const data = await res.json();
      if (data.conversation_id) setConversationId(data.conversation_id);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.answer ?? 'Sem resposta.', citations: data.citations ?? [] },
      ]);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao consultar o assistente. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-line bg-surface">
      {/* Mensagens */}
      <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto p-4 md:p-6">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-5 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Sparkles size={26} />
            </span>
            <div>
              <p className="font-serif text-xl text-cream">Como posso ajudar hoje?</p>
              <p className="mt-1 text-sm text-cream/50">Escolha um exemplo ou escreva sua própria pergunta.</p>
            </div>
            <div className="grid w-full max-w-xl gap-2 sm:grid-cols-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => send(ex)}
                  className="rounded-xl border border-line bg-surface-alt px-4 py-3 text-left text-sm text-cream/70 transition hover:border-gold/50 hover:text-cream"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  m.role === 'user' ? 'bg-cream/10 text-cream/70' : 'bg-gold/15 text-gold'
                }`}
              >
                {m.role === 'user' ? <UserIcon size={16} /> : <Bot size={16} />}
              </span>
              <div className={`max-w-[80%] ${m.role === 'user' ? 'text-right' : ''}`}>
                <div
                  className={`inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user'
                      ? 'bg-gold/15 text-cream'
                      : 'border border-line bg-surface-alt text-cream/90'
                  }`}
                >
                  {m.content}
                </div>
                {m.role === 'assistant' && m.citations && m.citations.length > 0 && (
                  <div className="mt-2 space-y-1 text-left">
                    <p className="text-xs uppercase tracking-wide text-cream/40">Fontes</p>
                    {m.citations.map((c, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-cream/50">
                        <FileText size={12} className="mt-0.5 shrink-0 text-gold/70" />
                        <span className="line-clamp-2">{c.content}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-gold">
              <Bot size={16} />
            </span>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-line bg-surface-alt px-4 py-2.5 text-sm text-cream/50">
              <Loader2 size={15} className="animate-spin" /> Consultando a base…
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Entrada */}
      <form onSubmit={onSubmit} className="border-t border-line bg-ink/40 p-3">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={1}
            placeholder="Escreva sua pergunta trabalhista ou sindical…"
            className="input max-h-40 flex-1 resize-none"
          />
          <button type="submit" disabled={loading || !input.trim()} className="btn-gold shrink-0" aria-label="Enviar">
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="mt-2 px-1 text-xs text-cream/35">
          As respostas são geradas por IA e não substituem orientação jurídica formal.
        </p>
      </form>
    </div>
  );
}
