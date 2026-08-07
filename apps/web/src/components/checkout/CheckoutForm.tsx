'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  BadgeCheck, Barcode, Check, Copy, CreditCard, Loader2, QrCode, ShieldCheck, Truck,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui';
import { formatBRL } from '@irts/shared';
import {
  cartaoValido, cpfCnpjValido, mascaraCartao, mascaraCep, mascaraCpfCnpj,
  mascaraTelefone, mascaraValidade, soDigitos,
} from '@/lib/masks';

/**
 * Checkout nativo: PIX, boleto e cartão resolvidos dentro da própria
 * plataforma, sem redirecionar o aluno para fora. A edge function `checkout`
 * fala com o Asaas e devolve o QR Code / linha digitável / resultado do cartão.
 */

export type ItemCheckout = {
  tipo: 'subscription' | 'course' | 'book';
  titulo: string;
  subtitulo?: string | null;
  precoCents: number;
  /** slug do plano (assinatura) ou id do produto (curso/livro) */
  planSlug?: string;
  produtoId?: string;
  intervalo?: 'month' | 'year' | string | null;
};

type Metodo = 'pix' | 'boleto' | 'credit_card';

type Resultado = {
  order_id?: string;
  subscription_id?: string;
  payment_id: string;
  method: Metodo;
  status: 'paid' | 'pending' | 'failed';
  asaas_status?: string;
  due_date?: string;
  invoice_url?: string | null;
  pix?: { imagemBase64: string; copiaECola: string; expiraEm: string };
  boleto?: { linhaDigitavel?: string; codigoDeBarras?: string; url?: string | null };
};

const METODOS: { id: Metodo; nome: string; icone: typeof QrCode; nota: string }[] = [
  { id: 'pix', nome: 'PIX', icone: QrCode, nota: 'Liberação na hora' },
  { id: 'credit_card', nome: 'Cartão', icone: CreditCard, nota: 'Aprovação imediata' },
  { id: 'boleto', nome: 'Boleto', icone: Barcode, nota: 'Compensa em até 3 dias' },
];

/** Intervalo entre consultas de situação enquanto o PIX/boleto não é pago. */
const POLL_MS = 5000;

export function CheckoutForm({
  item,
  perfil,
}: {
  item: ItemCheckout;
  perfil: { full_name?: string | null; cpf_cnpj?: string | null; phone?: string | null; fiscal?: any };
}) {
  const supabase = createClient();
  const endereco = (perfil?.fiscal?.address ?? {}) as Record<string, string>;

  const [metodo, setMetodo] = useState<Metodo>('pix');
  const [quantidade, setQuantidade] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [confirmado, setConfirmado] = useState(false);

  const [pagador, setPagador] = useState({
    name: perfil?.full_name ?? '',
    cpfCnpj: mascaraCpfCnpj(perfil?.cpf_cnpj ?? ''),
    phone: mascaraTelefone(perfil?.phone ?? ''),
    postalCode: mascaraCep(endereco.cep ?? endereco.postalCode ?? ''),
    addressNumber: endereco.numero ?? endereco.number ?? '',
    complement: endereco.complemento ?? '',
  });

  const [entrega, setEntrega] = useState({
    logradouro: endereco.logradouro ?? '',
    numero: endereco.numero ?? '',
    complemento: endereco.complemento ?? '',
    bairro: endereco.bairro ?? '',
    cidade: endereco.cidade ?? '',
    uf: endereco.uf ?? '',
    cep: mascaraCep(endereco.cep ?? ''),
  });

  const [cartao, setCartao] = useState({
    holderName: '',
    number: '',
    validade: '',
    ccv: '',
  });

  const total = item.precoCents * (item.tipo === 'book' ? quantidade : 1);
  const exigeCartao = metodo === 'credit_card';

  const setP = (k: keyof typeof pagador, v: string) => setPagador((p) => ({ ...p, [k]: v }));

  // ---- validação local (evita ida ao servidor com dado obviamente errado) --
  function validar(): string | null {
    if (pagador.name.trim().split(/\s+/).length < 2) return 'Informe o nome completo.';
    if (!cpfCnpjValido(pagador.cpfCnpj)) return 'CPF/CNPJ inválido.';
    if (exigeCartao) {
      if (soDigitos(pagador.phone).length < 10) return 'Informe um telefone com DDD.';
      if (soDigitos(pagador.postalCode).length !== 8) return 'Informe um CEP válido.';
      if (!pagador.addressNumber.trim()) return 'Informe o número do endereço.';
      if (!cartao.holderName.trim()) return 'Informe o nome impresso no cartão.';
      if (!cartaoValido(cartao.number)) return 'Número de cartão inválido.';
      const [mm, aa] = cartao.validade.split('/');
      if (!mm || !aa || Number(mm) < 1 || Number(mm) > 12) return 'Validade do cartão inválida.';
      if (soDigitos(cartao.ccv).length < 3) return 'CVV inválido.';
    }
    if (item.tipo === 'book') {
      if (!entrega.logradouro || !entrega.numero || !entrega.cidade || !entrega.uf) {
        return 'Preencha o endereço de entrega.';
      }
      if (soDigitos(entrega.cep).length !== 8) return 'CEP de entrega inválido.';
    }
    return null;
  }

  async function pagar(e: React.FormEvent) {
    e.preventDefault();
    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    setEnviando(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão expirada. Entre novamente para concluir a compra.');

      const [mm, aa] = cartao.validade.split('/');
      const corpo: Record<string, unknown> = {
        type: item.tipo,
        method: metodo,
        payer: {
          name: pagador.name.trim(),
          cpfCnpj: soDigitos(pagador.cpfCnpj),
          phone: soDigitos(pagador.phone),
          postalCode: soDigitos(pagador.postalCode),
          addressNumber: pagador.addressNumber,
          complement: pagador.complement,
        },
        ...(item.tipo === 'subscription' ? { plan_slug: item.planSlug } : {}),
        ...(item.tipo === 'course' ? { course_id: item.produtoId } : {}),
        ...(item.tipo === 'book'
          ? {
              book_id: item.produtoId,
              quantity: quantidade,
              shipping_address: { ...entrega, cep: soDigitos(entrega.cep) },
            }
          : {}),
        ...(exigeCartao
          ? {
              card: {
                holderName: cartao.holderName.trim(),
                number: soDigitos(cartao.number),
                expiryMonth: mm,
                expiryYear: aa,
                ccv: soDigitos(cartao.ccv),
              },
            }
          : {}),
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(corpo),
      });

      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados?.error ?? `Não foi possível processar o pagamento (${res.status}).`);

      setResultado(dados as Resultado);
      if (dados.status === 'paid') setConfirmado(true);
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao processar o pagamento.');
    } finally {
      setEnviando(false);
    }
  }

  // ---- polling enquanto aguarda PIX/boleto --------------------------------
  const consultar = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const qs = resultado?.order_id ? `&order_id=${resultado.order_id}` : '';
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/checkout?action=status${qs}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: 'status' }),
      },
    );
    const dados = await res.json().catch(() => ({}));
    if (dados?.status === 'paid') setConfirmado(true);
  }, [supabase, resultado?.order_id]);

  const consultarRef = useRef(consultar);
  consultarRef.current = consultar;

  useEffect(() => {
    if (!resultado || confirmado || resultado.status === 'failed') return;
    const t = setInterval(() => void consultarRef.current(), POLL_MS);
    return () => clearInterval(t);
  }, [resultado, confirmado]);

  // =======================================================================
  // TELA DE CONFIRMAÇÃO
  // =======================================================================
  if (confirmado) {
    return (
      <Card className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-400">
          <BadgeCheck size={32} />
        </div>
        <h2 className="mt-5 font-serif text-2xl text-cream">Pagamento confirmado</h2>
        <p className="mt-2 text-cream/60">
          {item.tipo === 'book'
            ? 'Seu pedido foi registrado e será enviado pelos Correios. Você acompanha o status em Minha Conta.'
            : 'Seu acesso já foi liberado. Bons estudos!'}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href={item.tipo === 'book' ? '/app/conta?tab=pedidos' : '/app'} className="btn-gold">
            {item.tipo === 'book' ? 'Ver meus pedidos' : 'Ir para a área de membros'}
          </Link>
        </div>
      </Card>
    );
  }

  // =======================================================================
  // AGUARDANDO PAGAMENTO (PIX / BOLETO)
  // =======================================================================
  if (resultado && resultado.status !== 'failed') {
    return (
      <PainelAguardando
        resultado={resultado}
        total={total}
        onVoltar={() => setResultado(null)}
      />
    );
  }

  // =======================================================================
  // FORMULÁRIO
  // =======================================================================
  return (
    <form onSubmit={pagar} className="space-y-6">
      {/* Resumo */}
      <Card>
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Você está pagando</p>
        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="font-serif text-xl text-cream">{item.titulo}</p>
            {item.subtitulo && <p className="mt-1 text-sm text-cream/50">{item.subtitulo}</p>}
          </div>
          <p className="shrink-0 text-2xl font-semibold text-gold">
            {formatBRL(total)}
            {item.tipo === 'subscription' && (
              <span className="text-sm text-cream/40">
                {item.intervalo === 'year' ? '/ano' : '/mês'}
              </span>
            )}
          </p>
        </div>

        {item.tipo === 'book' && (
          <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
            <label className="text-sm text-cream/70">Quantidade</label>
            <input
              type="number"
              min={1}
              max={20}
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(1, Math.min(20, Number(e.target.value) || 1)))}
              className="input w-20 py-1.5"
            />
          </div>
        )}
      </Card>

      {/* Método */}
      <Card>
        <p className="label">Forma de pagamento</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {METODOS.map((m) => {
            const ativo = metodo === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMetodo(m.id)}
                aria-pressed={ativo}
                className={`flex flex-col items-start gap-1 rounded-xl border px-4 py-3 text-left transition ${
                  ativo
                    ? 'border-gold bg-gold/10 text-cream'
                    : 'border-line text-cream/70 hover:border-gold/50'
                }`}
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  <m.icone size={16} className={ativo ? 'text-gold' : ''} /> {m.nome}
                </span>
                <span className="text-xs text-cream/45">{m.nota}</span>
              </button>
            );
          })}
        </div>
        {item.tipo === 'subscription' && metodo === 'boleto' && (
          <p className="mt-3 text-xs text-cream/50">
            Na assinatura por boleto, um novo boleto é gerado a cada ciclo e enviado por e-mail.
          </p>
        )}
      </Card>

      {/* Dados do pagador */}
      <Card className="space-y-4">
        <p className="label mb-0">Dados do pagador</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo label="Nome completo" value={pagador.name} onChange={(v) => setP('name', v)} autoComplete="name" required />
          <Campo
            label="CPF ou CNPJ"
            value={pagador.cpfCnpj}
            onChange={(v) => setP('cpfCnpj', mascaraCpfCnpj(v))}
            inputMode="numeric"
            required
          />
          <Campo
            label={`Telefone${exigeCartao ? '' : ' (opcional)'}`}
            value={pagador.phone}
            onChange={(v) => setP('phone', mascaraTelefone(v))}
            inputMode="tel"
            autoComplete="tel"
          />
          <Campo
            label={`CEP${exigeCartao ? '' : ' (opcional)'}`}
            value={pagador.postalCode}
            onChange={(v) => setP('postalCode', mascaraCep(v))}
            inputMode="numeric"
            autoComplete="postal-code"
          />
          {exigeCartao && (
            <>
              <Campo label="Número" value={pagador.addressNumber} onChange={(v) => setP('addressNumber', v)} required />
              <Campo label="Complemento (opcional)" value={pagador.complement} onChange={(v) => setP('complement', v)} />
            </>
          )}
        </div>
      </Card>

      {/* Endereço de entrega (livros) */}
      {item.tipo === 'book' && (
        <Card className="space-y-4">
          <p className="label mb-0 flex items-center gap-2">
            <Truck size={15} className="text-gold" /> Endereço de entrega
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Campo label="CEP" value={entrega.cep} onChange={(v) => setEntrega((e) => ({ ...e, cep: mascaraCep(v) }))} inputMode="numeric" required />
            <Campo label="Logradouro" value={entrega.logradouro} onChange={(v) => setEntrega((e) => ({ ...e, logradouro: v }))} required />
            <Campo label="Número" value={entrega.numero} onChange={(v) => setEntrega((e) => ({ ...e, numero: v }))} required />
            <Campo label="Complemento" value={entrega.complemento} onChange={(v) => setEntrega((e) => ({ ...e, complemento: v }))} />
            <Campo label="Bairro" value={entrega.bairro} onChange={(v) => setEntrega((e) => ({ ...e, bairro: v }))} />
            <Campo label="Cidade" value={entrega.cidade} onChange={(v) => setEntrega((e) => ({ ...e, cidade: v }))} required />
            <Campo label="UF" value={entrega.uf} onChange={(v) => setEntrega((e) => ({ ...e, uf: v.toUpperCase().slice(0, 2) }))} required />
          </div>
        </Card>
      )}

      {/* Cartão */}
      {exigeCartao && (
        <Card className="space-y-4">
          <p className="label mb-0">Dados do cartão</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Campo label="Nome impresso no cartão" value={cartao.holderName} onChange={(v) => setCartao((c) => ({ ...c, holderName: v.toUpperCase() }))} autoComplete="cc-name" required />
            </div>
            <div className="sm:col-span-2">
              <Campo label="Número do cartão" value={cartao.number} onChange={(v) => setCartao((c) => ({ ...c, number: mascaraCartao(v) }))} inputMode="numeric" autoComplete="cc-number" required />
            </div>
            <Campo label="Validade (MM/AA)" value={cartao.validade} onChange={(v) => setCartao((c) => ({ ...c, validade: mascaraValidade(v) }))} inputMode="numeric" autoComplete="cc-exp" required />
            <Campo label="CVV" value={cartao.ccv} onChange={(v) => setCartao((c) => ({ ...c, ccv: soDigitos(v).slice(0, 4) }))} inputMode="numeric" autoComplete="cc-csc" required />
          </div>
          <p className="flex items-start gap-2 text-xs text-cream/45">
            <ShieldCheck size={14} className="mt-0.5 shrink-0 text-gold" />
            Os dados do cartão são enviados por conexão segura direto ao Asaas, nosso processador
            de pagamentos, e não ficam armazenados nesta plataforma.
          </p>
        </Card>
      )}

      {erro && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {erro}
        </div>
      )}

      <button type="submit" disabled={enviando} className="btn-gold w-full py-3 text-base">
        {enviando ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
        {enviando
          ? 'Processando…'
          : metodo === 'pix'
            ? 'Gerar PIX'
            : metodo === 'boleto'
              ? 'Gerar boleto'
              : `Pagar ${formatBRL(total)}`}
      </button>
    </form>
  );
}

/* ------------------------------------------------------------------ campo */
function Campo({
  label, value, onChange, ...props
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} {...props} />
    </div>
  );
}

/* ------------------------------------------------- aguardando pagamento */
function PainelAguardando({
  resultado, total, onVoltar,
}: {
  resultado: Resultado;
  total: number;
  onVoltar: () => void;
}) {
  const [copiado, setCopiado] = useState<string | null>(null);

  async function copiar(texto: string, qual: string) {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(qual);
      setTimeout(() => setCopiado(null), 2500);
    } catch {
      setCopiado(null);
    }
  }

  return (
    <Card className="space-y-5">
      <div className="flex items-center gap-3">
        <Loader2 size={18} className="animate-spin text-gold" />
        <div>
          <p className="font-serif text-xl text-cream">Aguardando o pagamento</p>
          <p className="text-sm text-cream/50">
            Esta tela se atualiza sozinha assim que o pagamento cair. Pode deixá-la aberta.
          </p>
        </div>
      </div>

      {/* PIX */}
      {resultado.pix && (
        <div className="space-y-4 border-t border-line pt-5">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${resultado.pix.imagemBase64}`}
              alt="QR Code do PIX"
              className="h-52 w-52 shrink-0 rounded-xl bg-white p-2"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-cream/70">
                Abra o app do seu banco, escolha <strong className="text-cream">PIX &rarr; Ler QR Code</strong> e
                aponte para o código. Ou use o PIX copia e cola:
              </p>
              <div className="mt-3 break-all rounded-xl border border-line bg-surface-alt p-3 font-mono text-xs text-cream/70">
                {resultado.pix.copiaECola}
              </div>
              <button
                type="button"
                onClick={() => copiar(resultado.pix!.copiaECola, 'pix')}
                className="btn-outline mt-3 w-full sm:w-auto"
              >
                {copiado === 'pix' ? <Check size={15} /> : <Copy size={15} />}
                {copiado === 'pix' ? 'Código copiado' : 'Copiar código PIX'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Boleto */}
      {resultado.boleto && (
        <div className="space-y-3 border-t border-line pt-5">
          <p className="text-sm text-cream/70">
            Pague o boleto no app do seu banco. A confirmação leva até 3 dias úteis.
          </p>
          {resultado.boleto.linhaDigitavel && (
            <>
              <div className="break-all rounded-xl border border-line bg-surface-alt p-3 font-mono text-sm text-cream/80">
                {resultado.boleto.linhaDigitavel}
              </div>
              <button
                type="button"
                onClick={() => copiar(resultado.boleto!.linhaDigitavel!, 'boleto')}
                className="btn-outline"
              >
                {copiado === 'boleto' ? <Check size={15} /> : <Copy size={15} />}
                {copiado === 'boleto' ? 'Linha copiada' : 'Copiar linha digitável'}
              </button>
            </>
          )}
          {resultado.boleto.url && (
            <a href={resultado.boleto.url} target="_blank" rel="noopener noreferrer" className="btn-ghost block text-center sm:inline-flex">
              Abrir boleto em PDF
            </a>
          )}
        </div>
      )}

      {/* Cartão em análise */}
      {!resultado.pix && !resultado.boleto && (
        <div className="border-t border-line pt-5 text-sm text-cream/70">
          Seu pagamento está em análise pela operadora do cartão. Assim que for aprovado, o acesso
          é liberado automaticamente.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5 text-sm">
        <span className="text-cream/50">Total: <strong className="text-gold">{formatBRL(total)}</strong></span>
        <button type="button" onClick={onVoltar} className="text-cream/60 hover:text-gold">
          Escolher outra forma de pagamento
        </button>
      </div>
    </Card>
  );
}
