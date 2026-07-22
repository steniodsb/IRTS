import { Badge } from '@/components/ui';

export const metadata = { title: 'Política de privacidade' };

export default function PrivacidadePage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Badge tone="warning">Modelo — revisar juridicamente</Badge>
      <h1 className="mt-5 font-serif text-4xl text-cream">Política de Privacidade</h1>
      <p className="mt-2 text-sm text-cream/40">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

      <div className="mt-10 space-y-8 text-cream/70">
        <section>
          <p>Esta Política descreve como o IRTS coleta, utiliza e protege os dados pessoais dos usuários, em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados — LGPD).</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">1. Controlador dos dados</h2>
          <p className="mt-3">O IRTS é o controlador dos dados pessoais tratados na plataforma. Dúvidas sobre privacidade podem ser encaminhadas pelo e-mail de contato disponível na página de Contato.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">2. Dados que coletamos</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>Dados cadastrais: nome, e-mail, telefone e, quando aplicável, CPF/CNPJ e endereço (para nota fiscal e envio de livros).</li>
            <li>Dados de uso: progresso em cursos, downloads, interações e registros de acesso.</li>
            <li>Dados de pagamento: processados por provedor externo; não armazenamos dados completos de cartão.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">3. Finalidades e base legal</h2>
          <p className="mt-3">Tratamos os dados para execução do contrato (acesso aos serviços), cumprimento de obrigações legais e fiscais, e com base no legítimo interesse ou consentimento, conforme o caso, para comunicação e melhoria da plataforma.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">4. Compartilhamento</h2>
          <p className="mt-3">Os dados podem ser compartilhados com operadores estritamente necessários à prestação do serviço (hospedagem, pagamentos, logística de envio), sempre sob obrigações de confidencialidade e segurança.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">5. Direitos do titular</h2>
          <p className="mt-3">Nos termos da LGPD, o titular pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação e revogação de consentimento, mediante requisição pelos canais de contato.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">6. Segurança e retenção</h2>
          <p className="mt-3">Adotamos medidas técnicas e organizacionais para proteger os dados. Os dados são retidos pelo período necessário às finalidades informadas ou por exigência legal.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">7. Cookies</h2>
          <p className="mt-3">Utilizamos cookies essenciais para autenticação e funcionamento da plataforma, e, quando aplicável, cookies de análise para melhorar a experiência.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">8. Encarregado (DPO)</h2>
          <p className="mt-3">O encarregado pelo tratamento de dados poderá ser contatado pelos canais indicados na página de Contato.</p>
        </section>
      </div>

      <p className="mt-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300/80">
        Este é um documento-modelo com estrutura aderente à LGPD, fornecido apenas como ponto de partida. Deve ser revisado por um advogado e adaptado à realidade do IRTS antes da publicação definitiva.
      </p>
    </article>
  );
}
