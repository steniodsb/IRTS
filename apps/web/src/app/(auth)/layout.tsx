import { Logo } from '@/components/Logo';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(201,162,39,0.10),transparent_60%)]" />
      <div className="relative w-full max-w-md">
        <div className="mb-8 flex justify-center"><Logo withText size={56} /></div>
        <div className="card p-8">{children}</div>
      </div>
    </div>
  );
}
