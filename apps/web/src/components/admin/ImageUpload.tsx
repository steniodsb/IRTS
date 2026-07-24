'use client';
import { useState } from 'react';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/**
 * Upload de imagem para um bucket público do Supabase Storage.
 * Retorna a URL pública via onChange. Mostra preview.
 */
export function ImageUpload({
  bucket = 'course-covers',
  prefix = '',
  value,
  onChange,
  label = 'Capa',
  aspect = 'aspect-video',
}: {
  bucket?: string;
  prefix?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspect?: string;
}) {
  const supabase = createClient();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true); setErr(null);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const path = `${prefix ? prefix + '/' : ''}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        cacheControl: '3600', upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (e: any) {
      setErr(e.message ?? 'Falha no upload.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label className="label">{label}</label>
      <div className={`relative w-full overflow-hidden rounded-xl border border-line bg-surface-alt ${aspect}`}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-cream/30">
            <ImagePlus size={28} />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="animate-spin text-gold" />
          </div>
        )}
        {value && !busy && (
          <button type="button" onClick={() => onChange(null)}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/90 hover:text-red-400">
            <X size={16} />
          </button>
        )}
      </div>
      <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-gold hover:underline">
        <ImagePlus size={15} /> {value ? 'Trocar imagem' : 'Enviar imagem'}
        <input type="file" accept="image/*" className="hidden" onChange={onFile} disabled={busy} />
      </label>
      {err && <p className="mt-1 text-sm text-red-400">{err}</p>}
    </div>
  );
}
