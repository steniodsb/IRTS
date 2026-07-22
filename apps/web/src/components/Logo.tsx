import Image from 'next/image';
import Link from 'next/link';

export function Logo({ href = '/', size = 40, withText = false }: { href?: string; size?: number; withText?: boolean }) {
  return (
    <Link href={href} className="inline-flex items-center gap-3">
      <Image
        src="/brand/irts-logo.jpeg"
        alt="IRTS"
        width={size}
        height={size}
        className="rounded-md object-contain"
        priority
      />
      {withText && (
        <span className="font-serif text-xl tracking-wide text-gold">IRTS</span>
      )}
    </Link>
  );
}
