import { Badge } from '@/components/ui';

export const metadata = { title: 'Termos de uso' };

export default function TermosPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <Badge tone="warning">Modelo — revisar juridicamente</Badge>
      <h1 className="mt-5 font-serif text-4xl text-cream">Termos de Uso</h1>
      <p className="mt-2 text-sm text-cream/40">Última atualização: {new Date().toLocaleDateString('pt-BR')}</p>

      <div className="prose-invert mt-10 space-y-8 text-cream/70">
        <section>
          <h2 className="font-serif text-2xl text-cream">1. Aceitação dos termos</h2>
          <p className="mt-3">Ao acessar e utilizar a plataforma IRTS — Inteligência em Relações Trabalhistas e Sindicais, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">2. Cadastro e conta</h2>
          <p className="mt-3">O usuário é responsável pela veracidade das informações fornecidas e pela guarda de suas credenciais de acesso. É vedado o compartilhamento de conta.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">3. Assinaturas e pagamentos</h2>
          <p className="mt-3">Os planos, valores e formas de pagamento são apresentados na página de Planos. As renovações e cancelamentos seguem as regras vigentes no ato da contratação. Livros físicos estão sujeitos a frete e prazos de entrega dos Correios.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">4. Propriedade intelectual</h2>
          <p className="mt-3">Todo o conteúdo (cursos, materiais, textos, marcas e Consultor IA) é protegido por direitos autorais e pertence ao IRTS ou a seus licenciadores. É proibida a reprodução, distribuição ou revenda sem autorização.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">5. Uso adequado</h2>
          <p className="mt-3">O usuário compromete-se a não utilizar a plataforma para fins ilícitos, a não tentar burlar mecanismos de segurança e a não realizar engenharia reversa dos serviços.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">6. Limitação de responsabilidade</h2>
          <p className="mt-3">O conteúdo tem caráter educativo e informativo, não constituindo aconselhamento jurídico individualizado. As respostas do Consultor IA podem conter imprecisões e devem ser validadas por profissional habilitado.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">7. Alterações</h2>
          <p className="mt-3">Estes termos podem ser atualizados a qualquer tempo. A versão vigente estará sempre disponível nesta página.</p>
        </section>
        <section>
          <h2 className="font-serif text-2xl text-cream">8. Foro</h2>
          <p className="mt-3">Fica eleito o foro da comarca do domicílio do IRTS para dirimir eventuais controvérsias, com renúncia a qualquer outro.</p>
        </section>
      </div>

      <p className="mt-12 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-amber-300/80">
        Este é um documento-modelo, fornecido apenas como ponto de partida. Deve ser revisado por um advogado antes da publicação definitiva.
      </p>
    </article>
  );
}
