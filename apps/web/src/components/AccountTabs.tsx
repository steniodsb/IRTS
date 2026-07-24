'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  User, CreditCard, Receipt, Download, Bell, Settings, Loader2, Check, Lock, KeyRound, FileText, ExternalLink,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card, Badge, EmptyState, LinkButton } from '@/components/ui';
import {
  formatBRL, formatDate, formatDateTime, relativeTime, initials,
  LIBRARY_TYPE_LABELS, type LibraryType,
} from '@irts/shared';

const TABS = [
  { key: 'perfil', label: 'Perfil', icon: User },
  { key: 'assinatura', label: 'Assinatura', icon: CreditCard },
  { key: 'pagamentos', label: 'Pagamentos', icon: Receipt },
  { key: 'downloads', label: 'Downloads', icon: Download },
  { key: 'notificacoes', label: 'Notificações', icon: Bell },
  { key: 'config', label: 'Configurações', icon: Settings },
] as const;

const STATUS_LABELS: Record<string, string> = {
  active: 'Ativa', trialing: 'Em teste', past_due: 'Pagamento pendente', canceled: 'Cancelada', incomplete: 'Incompleta',
};
const ORDER_LABELS: Record<string, string> = {
  pending: 'Pendente', paid: 'Pago', shipped: 'Enviado', delivered: 'Entregue', canceled: 'Cancelado', refunded: 'Reembolsado',
};

export function AccountTabs({
  activeTab, userId, userEmail, profile, subscription, orders, downloads, notifications,
}: {
  activeTab: string;
  userId: string;
  userEmail: string;
  profile: any;
  subscription: any;
  orders: any[];
  downloads: any[];
  notifications: any[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      {/* Navegação de abas */}
      <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          return (
            <Link
              key={t.key}
              href={`/app/conta?tab=${t.key}`}
              className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? 'bg-gold/10 text-gold' : 'text-cream/70 hover:bg-navy/5 hover:text-cream'
              }`}
            >
              <t.icon size={17} /> {t.label}
            </Link>
          );
        })}
      </nav>

      <div className="min-w-0">
        {activeTab === 'perfil' && <PerfilTab userId={userId} userEmail={userEmail} profile={profile} />}
        {activeTab === 'assinatura' && <AssinaturaTab subscription={subscription} />}
        {activeTab === 'pagamentos' && <PagamentosTab orders={orders} />}
        {activeTab === 'downloads' && <DownloadsTab downloads={downloads} />}
        {activeTab === 'notificacoes' && <NotificacoesTab items={notifications} />}
        {activeTab === 'config' && <ConfigTab userId={userId} profile={profile} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ PERFIL */
function PerfilTab({ userId, userEmail, profile }: { userId: string; userEmail: string; profile: any }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    full_name: profile?.full_name ?? '',
    phone: profile?.phone ?? '',
    cpf_cnpj: profile?.cpf_cnpj ?? '',
    bio: profile?.bio ?? '',
  });
  const fiscal = profile?.fiscal ?? {};
  const addr = fiscal.address ?? {};
  const [fiscalForm, setFiscalForm] = useState({
    zip: addr.zip ?? '', street: addr.street ?? '', number: addr.number ?? '',
    city: addr.city ?? '', state: addr.state ?? '',
  });
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    const ext = file.name.split('.').pop();
    const path = `${userId}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
    if (upErr) {
      setError('Falha ao enviar a imagem.');
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    const url = `${data.publicUrl}?t=${Date.now()}`;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
    setAvatarUrl(url);
    setUploading(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name || null,
        phone: form.phone || null,
        cpf_cnpj: form.cpf_cnpj || null,
        bio: form.bio || null,
        fiscal: { ...fiscal, address: fiscalForm },
      })
      .eq('id', userId);
    setSaving(false);
    if (err) { setError('Não foi possível salvar. Tente novamente.'); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <form onSubmit={save} className="space-y-6">
      <Card className="space-y-5">
        <div className="flex items-center gap-4">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gold/20 text-lg font-semibold text-gold">
              {initials(form.full_name)}
            </span>
          )}
          <label className="btn-outline cursor-pointer">
            {uploading ? <><Loader2 size={16} className="animate-spin" /> Enviando…</> : 'Trocar foto'}
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Nome completo</label>
            <input className="input" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
          </div>
          <div>
            <label className="label">E-mail</label>
            <input className="input opacity-60" value={userEmail} disabled />
          </div>
          <div>
            <label className="label">Telefone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="label">CPF / CNPJ</label>
            <input className="input" value={form.cpf_cnpj} onChange={(e) => setForm({ ...form, cpf_cnpj: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Bio</label>
            <textarea className="input resize-none" rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card className="space-y-4">
        <p className="font-medium text-cream">Endereço fiscal</p>
        <p className="-mt-2 text-sm text-cream/50">Usado para emissão de nota fiscal e envio de livros físicos.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">CEP</label>
            <input className="input" value={fiscalForm.zip} onChange={(e) => setFiscalForm({ ...fiscalForm, zip: e.target.value })} />
          </div>
          <div>
            <label className="label">Cidade</label>
            <input className="input" value={fiscalForm.city} onChange={(e) => setFiscalForm({ ...fiscalForm, city: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Rua</label>
            <input className="input" value={fiscalForm.street} onChange={(e) => setFiscalForm({ ...fiscalForm, street: e.target.value })} />
          </div>
          <div>
            <label className="label">Número</label>
            <input className="input" value={fiscalForm.number} onChange={(e) => setFiscalForm({ ...fiscalForm, number: e.target.value })} />
          </div>
          <div>
            <label className="label">Estado (UF)</label>
            <input className="input" value={fiscalForm.state} onChange={(e) => setFiscalForm({ ...fiscalForm, state: e.target.value })} />
          </div>
        </div>
      </Card>

      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-gold">
          {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> : 'Salvar alterações'}
        </button>
        {saved && <span className="inline-flex items-center gap-1 text-sm text-emerald-400"><Check size={16} /> Salvo</span>}
      </div>
    </form>
  );
}

/* -------------------------------------------------------------- ASSINATURA */
function AssinaturaTab({ subscription }: { subscription: any }) {
  const supabase = createClient();
  const [canceling, setCanceling] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function cancel() {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura? Você manterá o acesso até o fim do período vigente.')) return;
    setCanceling(true);
    setMessage(null);
    try {
      // A edge function `checkout` (action=cancel) processa o cancelamento junto ao provedor.
      // Exige o token do usuário (verify_jwt).
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout?action=cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token ?? ''}`,
        },
        body: JSON.stringify({ action: 'cancel' }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setMessage('Solicitação de cancelamento enviada. Você manterá o acesso até o fim do período vigente.');
    } catch {
      setMessage('Não foi possível processar agora. Tente novamente mais tarde ou fale com o suporte.');
    } finally {
      setCanceling(false);
    }
  }

  if (!subscription) {
    return (
      <EmptyState
        title="Você não tem uma assinatura ativa"
        description="Assine um plano para desbloquear cursos, biblioteca e o Consultor IA."
        action={<LinkButton href="/planos" variant="gold" className="mt-2">Ver planos</LinkButton>}
      />
    );
  }

  const plan = subscription.plans;
  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-serif text-xl text-cream">{plan?.name ?? 'Plano'}</p>
            {plan && (
              <p className="mt-1 text-cream/60">
                {formatBRL(plan.price_cents)}
                {plan.interval === 'month' ? '/mês' : plan.interval === 'year' ? '/ano' : ''}
              </p>
            )}
          </div>
          <Badge tone={subscription.status === 'active' ? 'success' : subscription.status === 'past_due' ? 'warning' : 'default'}>
            {STATUS_LABELS[subscription.status] ?? subscription.status}
          </Badge>
        </div>

        {subscription.current_period_end && (
          <p className="text-sm text-cream/55">
            {subscription.cancel_at_period_end ? 'Acesso até ' : 'Renova em '}
            {formatDate(subscription.current_period_end)}
          </p>
        )}

        {Array.isArray(plan?.features) && plan.features.length > 0 && (
          <ul className="space-y-1.5">
            {plan.features.map((f: string, i: number) => (
              <li key={i} className="flex items-center gap-2 text-sm text-cream/70">
                <Check size={15} className="text-gold" /> {f}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {message && <p className="rounded-xl border border-line bg-surface-alt px-4 py-3 text-sm text-cream/70">{message}</p>}

      {!subscription.cancel_at_period_end && subscription.status !== 'canceled' && (
        <button onClick={cancel} disabled={canceling} className="btn-ghost text-red-400 hover:bg-red-500/10">
          {canceling ? <><Loader2 size={16} className="animate-spin" /> Processando…</> : 'Cancelar assinatura'}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------- PAGAMENTOS */
function PagamentosTab({ orders }: { orders: any[] }) {
  if (orders.length === 0) {
    return <EmptyState title="Nenhum pagamento" description="Seu histórico de compras aparecerá aqui." />;
  }
  return (
    <Card className="overflow-hidden p-0">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-line text-left text-xs uppercase text-cream/40">
            <tr>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Rastreio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line/60">
            {orders.map((o) => (
              <tr key={o.id} className="text-cream/80">
                <td className="px-4 py-3">{formatDate(o.created_at)}</td>
                <td className="px-4 py-3">{formatBRL(o.total_cents)}</td>
                <td className="px-4 py-3">
                  <Badge tone={o.status === 'paid' || o.status === 'delivered' ? 'success' : o.status === 'canceled' || o.status === 'refunded' ? 'default' : 'warning'}>
                    {ORDER_LABELS[o.status] ?? o.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-cream/50">{o.tracking_code ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* --------------------------------------------------------------- DOWNLOADS */
function DownloadsTab({ downloads }: { downloads: any[] }) {
  if (downloads.length === 0) {
    return <EmptyState title="Nenhum download" description="Os materiais que você baixar na Biblioteca aparecerão aqui." />;
  }
  return (
    <div className="space-y-3">
      {downloads.map((d) => {
        const item = d.library_items;
        return (
          <Card key={d.id} className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <FileText size={18} className="shrink-0 text-cream/40" />
              <div className="min-w-0">
                <p className="truncate font-medium text-cream">{item?.title ?? 'Material'}</p>
                <p className="text-xs text-cream/40">
                  {item?.type ? (LIBRARY_TYPE_LABELS[item.type as LibraryType] ?? item.type) : ''} · {relativeTime(d.created_at)}
                </p>
              </div>
            </div>
            {item?.file_url && (
              <a href={item.file_url} target="_blank" rel="noreferrer" className="shrink-0 text-sm text-gold hover:underline">
                <span className="inline-flex items-center gap-1">Abrir <ExternalLink size={13} /></span>
              </a>
            )}
          </Card>
        );
      })}
    </div>
  );
}

/* ----------------------------------------------------------- NOTIFICAÇÕES */
function NotificacoesTab({ items }: { items: any[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [list, setList] = useState(items);

  async function markRead(id: string) {
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id);
    router.refresh();
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    const unread = list.filter((n) => !n.read_at).map((n) => n.id);
    if (unread.length === 0) return;
    setList((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    await supabase.from('notifications').update({ read_at: now }).in('id', unread);
    router.refresh();
  }

  if (list.length === 0) {
    return <EmptyState title="Sem notificações" description="Você está em dia! Novos avisos aparecerão aqui." />;
  }

  const hasUnread = list.some((n) => !n.read_at);

  return (
    <div className="space-y-3">
      {hasUnread && (
        <div className="flex justify-end">
          <button onClick={markAllRead} className="btn-ghost text-sm">Marcar todas como lidas</button>
        </div>
      )}
      {list.map((n) => (
        <Card key={n.id} className={n.read_at ? 'opacity-60' : 'border-gold/40'}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-medium text-cream">{n.title}</p>
              {n.body && <p className="mt-0.5 text-sm text-cream/55">{n.body}</p>}
              <p className="mt-1 text-xs text-cream/40">{formatDateTime(n.created_at)}</p>
            </div>
            {!n.read_at && (
              <button onClick={() => markRead(n.id)} className="shrink-0 text-xs text-gold hover:underline">
                Marcar como lida
              </button>
            )}
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------ CONFIGURAÇÕES */
function ConfigTab({ userId, profile }: { userId: string; profile: any }) {
  const supabase = createClient();

  // Alterar senha
  const [pwd, setPwd] = useState('');
  const [pwd2, setPwd2] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwd.length < 8) { setPwdMsg({ ok: false, text: 'A senha deve ter ao menos 8 caracteres.' }); return; }
    if (pwd !== pwd2) { setPwdMsg({ ok: false, text: 'As senhas não coincidem.' }); return; }
    setPwdSaving(true);
    setPwdMsg(null);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setPwdSaving(false);
    if (error) { setPwdMsg({ ok: false, text: 'Não foi possível alterar a senha.' }); return; }
    setPwd(''); setPwd2('');
    setPwdMsg({ ok: true, text: 'Senha alterada com sucesso.' });
  }

  // Preferências de notificação
  const initialPrefs = profile?.notify_prefs ?? { email: true, push: true };
  const [prefs, setPrefs] = useState({ email: initialPrefs.email ?? true, push: initialPrefs.push ?? true });
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  async function savePrefs(next: { email: boolean; push: boolean }) {
    setPrefs(next);
    setPrefsSaving(true);
    setPrefsSaved(false);
    await supabase.from('profiles').update({ notify_prefs: next }).eq('id', userId);
    setPrefsSaving(false);
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 2500);
  }

  return (
    <div className="space-y-6">
      {/* Senha */}
      <Card className="space-y-4">
        <p className="flex items-center gap-2 font-medium text-cream"><KeyRound size={17} className="text-gold" /> Alterar senha</p>
        <form onSubmit={changePassword} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label">Nova senha</label>
              <input type="password" className="input" value={pwd} onChange={(e) => setPwd(e.target.value)} autoComplete="new-password" />
            </div>
            <div>
              <label className="label">Confirmar nova senha</label>
              <input type="password" className="input" value={pwd2} onChange={(e) => setPwd2(e.target.value)} autoComplete="new-password" />
            </div>
          </div>
          {pwdMsg && <p className={`text-sm ${pwdMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{pwdMsg.text}</p>}
          <button type="submit" disabled={pwdSaving} className="btn-gold">
            {pwdSaving ? <><Loader2 size={16} className="animate-spin" /> Salvando…</> : <><Lock size={16} /> Atualizar senha</>}
          </button>
        </form>
      </Card>

      {/* Preferências */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 font-medium text-cream"><Bell size={17} className="text-gold" /> Preferências de notificação</p>
          {prefsSaving ? <Loader2 size={15} className="animate-spin text-cream/40" /> : prefsSaved ? <span className="inline-flex items-center gap-1 text-xs text-emerald-400"><Check size={13} /> Salvo</span> : null}
        </div>
        <label className="flex items-center justify-between border-b border-line/60 py-2">
          <span className="text-sm text-cream/80">Receber notificações por e-mail</span>
          <input type="checkbox" checked={prefs.email} onChange={(e) => savePrefs({ ...prefs, email: e.target.checked })} className="h-4 w-4 accent-gold" />
        </label>
        <label className="flex items-center justify-between py-2">
          <span className="text-sm text-cream/80">Receber notificações push</span>
          <input type="checkbox" checked={prefs.push} onChange={(e) => savePrefs({ ...prefs, push: e.target.checked })} className="h-4 w-4 accent-gold" />
        </label>
      </Card>
    </div>
  );
}
