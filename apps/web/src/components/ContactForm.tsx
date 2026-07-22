'use client';
import { useState } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui';

export function ContactForm({ email }: { email: string }) {
  const [name, setName] = useState('');
  const [from, setFrom] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    // Não há tabela de contato: abrimos o cliente de e-mail do usuário com a mensagem pré-preenchida.
    const subject = encodeURIComponent(`Contato pelo site — ${name || 'IRTS'}`);
    const body = encodeURIComponent(`Nome: ${name}\nE-mail: ${from}\n\n${message}`);
    if (email) window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div className="card flex flex-col items-center gap-3 p-8 text-center">
        <CheckCircle2 className="text-emerald-400" size={36} />
        <p className="font-serif text-xl text-cream">Mensagem preparada</p>
        <p className="max-w-sm text-sm text-cream/55">
          Abrimos seu aplicativo de e-mail com a mensagem pronta. Se não abriu, escreva para{' '}
          {email ? <a href={`mailto:${email}`} className="text-gold hover:underline">{email}</a> : 'nosso e-mail'}.
        </p>
        <button onClick={() => setSent(false)} className="text-sm text-gold hover:underline">Enviar outra mensagem</button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div>
        <label className="label" htmlFor="c-name">Nome</label>
        <input id="c-name" className="input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Seu nome" />
      </div>
      <div>
        <label className="label" htmlFor="c-email">E-mail</label>
        <input id="c-email" type="email" className="input" value={from} onChange={(e) => setFrom(e.target.value)} required placeholder="voce@email.com" />
      </div>
      <div>
        <label className="label" htmlFor="c-msg">Mensagem</label>
        <textarea id="c-msg" className="input min-h-32" value={message} onChange={(e) => setMessage(e.target.value)} required placeholder="Como podemos ajudar?" />
      </div>
      <Button type="submit" className="w-full">Enviar mensagem <Send size={16} /></Button>
    </form>
  );
}
