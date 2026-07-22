/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@irts/shared'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'ivezfeaztisayqatyrkg.supabase.co' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
    ],
  },
};
export default nextConfig;
