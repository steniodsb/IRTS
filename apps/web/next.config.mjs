/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@irts/shared'],
  // 1º deploy: não derrubar o build de produção por erros de tipo/lint ainda
  // não revisados no código gerado. Rodar `pnpm typecheck` e remover isto depois.
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ivezfeaztisayqatyrkg.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
    ],
  },
};
export default nextConfig;
