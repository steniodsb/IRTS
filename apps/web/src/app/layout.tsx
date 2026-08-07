import type { Metadata } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans', display: 'swap' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-serif',
  display: 'swap',
});

/** Aceita domínio com ou sem protocolo (ex.: "irts.vercel.app" → "https://irts.vercel.app"). */
function resolveSiteUrl(): string {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '') ||
    'http://localhost:3000';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    return new URL(url).toString();
  } catch {
    return 'http://localhost:3000';
  }
}

export const metadata: Metadata = {
  title: { default: 'IRTS Academy — Relações Trabalhistas e Sindicais', template: '%s · IRTS Academy' },
  description:
    'Cursos, biblioteca técnica, mentorias e ferramentas de negociação em relações trabalhistas e sindicais.',
  metadataBase: new URL(resolveSiteUrl()),
};

/**
 * Aplica o tema antes da primeira pintura, evitando a piscada de tela clara
 * em quem escolheu o escuro. Sem preferência salva, segue o sistema.
 */
const themeScript = `
(function(){try{
  var t = localStorage.getItem('irts-theme');
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  if (t === 'dark') document.documentElement.classList.add('dark');
}catch(e){}})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${cormorant.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
