'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui';

type Mode = 'login' | 'signup' | 'reset';

export function AuthForm({ mode }: { mode: Mode }) {
  const supabase = createClient();
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/app';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'ok'; text: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setMsg(null);
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: name }, emailRedirectTo: `${location.origin}/auth/callback` },
        });
        if (error) throw error;
        router.push(redirect); router.refresh();
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(redirect); router.refresh();
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${location.origin}/auth/callback?next=/app/conta`,
        });
        if (error) throw error;
        setMsg({ type: 'ok', text: 'Enviamos um link de redefinição para seu e-mail.' });
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: traduz(err.message) });
    } finally {
      setLoading(false);
    }
  }

  async function google() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${redirect}` },
    });
  }

  return (
    <div>
      <h1 className="font-serif text-2xl text-cream">
        {mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Recuperar senha'}
      </h1>
      <p className="mt-1 text-sm text-cream/50">
        {mode === 'login' ? 'Acesse sua área de membros.' : mode === 'signup' ? 'Comece em menos de um minuto.' : 'Enviaremos um link para redefinir.'}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {mode === 'signup' && (
          <div>
            <label className="label">Nome completo</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
        )}
        <div>
          <label className="label">E-mail</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        {mode !== 'reset' && (
          <div>
            <label className="label">Senha</label>
            <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
          </div>
        )}
        {msg && (
          <p className={`text-sm ${msg.type === 'error' ? 'text-red-400' : 'text-emerald-400'}`}>{msg.text}</p>
        )}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : mode === 'signup' ? 'Criar conta' : 'Enviar link'}
        </Button>
      </form>

      {mode !== 'reset' && (
        <>
          <div className="my-5 flex items-center gap-3 text-xs text-cream/30">
            <div className="h-px flex-1 bg-line" /> ou <div className="h-px flex-1 bg-line" />
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={google}>Continuar com Google</Button>
        </>
      )}

      <div className="mt-6 space-y-1 text-center text-sm text-cream/50">
        {mode === 'login' && <>
          <p><Link href="/recuperar-senha" className="text-gold hover:underline">Esqueci minha senha</Link></p>
          <p>Não tem conta? <Link href="/cadastro" className="text-gold hover:underline">Criar conta</Link></p>
        </>}
        {mode === 'signup' && <p>Já tem conta? <Link href="/login" className="text-gold hover:underline">Entrar</Link></p>}
        {mode === 'reset' && <p><Link href="/login" className="text-gold hover:underline">Voltar ao login</Link></p>}
      </div>
    </div>
  );
}

function traduz(m: string): string {
  if (/Invalid login credentials/i.test(m)) return 'E-mail ou senha inválidos.';
  if (/User already registered/i.test(m)) return 'Este e-mail já possui conta.';
  if (/Password should be/i.test(m)) return 'A senha deve ter ao menos 6 caracteres.';
  return m;
}
