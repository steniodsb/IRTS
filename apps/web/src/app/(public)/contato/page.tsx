import { Mail, MessageCircle, Instagram, Linkedin } from 'lucide-react';
import { SectionTitle } from '@/components/ui';
import { ContactForm } from '@/components/ContactForm';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Contato' };

export default async function ContatoPage() {
  const supabase = createClient();
  const { data: setting } = await supabase
    .from('site_settings').select('value').eq('key', 'contact').maybeSingle();

  const contact: any = setting?.value ?? {};
  const email: string = contact.email || 'contato@irts.com.br';
  const whatsapp: string = contact.whatsapp || '';
  const instagram: string = contact.instagram || '';
  const linkedin: string = contact.linkedin || '';
  const waDigits = whatsapp.replace(/\D/g, '');

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <SectionTitle center overline="Fale com o IRTS" title="Contato" subtitle="Tire dúvidas sobre cursos, mentorias, livros e planos. Respondemos o quanto antes." />

      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div className="space-y-4">
          <a href={`mailto:${email}`} className="card flex items-center gap-4 p-5 transition hover:border-gold/50">
            <Mail className="text-gold" size={22} />
            <div>
              <p className="text-sm text-cream/50">E-mail</p>
              <p className="text-cream">{email}</p>
            </div>
          </a>
          {waDigits && (
            <a href={`https://wa.me/${waDigits}`} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:border-gold/50">
              <MessageCircle className="text-gold" size={22} />
              <div>
                <p className="text-sm text-cream/50">WhatsApp</p>
                <p className="text-cream">{whatsapp}</p>
              </div>
            </a>
          )}
          {instagram && (
            <a href={instagram.startsWith('http') ? instagram : `https://instagram.com/${instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:border-gold/50">
              <Instagram className="text-gold" size={22} />
              <div>
                <p className="text-sm text-cream/50">Instagram</p>
                <p className="text-cream">{instagram}</p>
              </div>
            </a>
          )}
          {linkedin && (
            <a href={linkedin.startsWith('http') ? linkedin : `https://linkedin.com/in/${linkedin}`} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-5 transition hover:border-gold/50">
              <Linkedin className="text-gold" size={22} />
              <div>
                <p className="text-sm text-cream/50">LinkedIn</p>
                <p className="text-cream">{linkedin}</p>
              </div>
            </a>
          )}
        </div>

        <ContactForm email={email} />
      </div>
    </section>
  );
}
