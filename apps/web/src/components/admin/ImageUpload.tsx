'use client';
import { useRef, useState } from 'react';
import { Crop, ImagePlus, Loader2, X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { ImageCropper } from '@/components/admin/ImageCropper';

/**
 * Upload de imagem para um bucket público do Supabase Storage.
 *
 * O arquivo escolhido passa antes pelo editor de recorte: o que o admin
 * enquadra é exatamente o que é gravado. Sem isso a imagem subia inteira e o
 * corte acontecia só no CSS (`object-cover`), cortando partes importantes.
 */

/** Tamanho máximo do arquivo de entrada (antes do recorte). */
const MAX_INPUT_MB = 15;

export function ImageUpload({
  bucket = 'course-covers',
  prefix = '',
  value,
  onChange,
  label = 'Capa',
  ratio = 16 / 9,
}: {
  bucket?: string;
  prefix?: string;
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  /** Proporção largura/altura em que a imagem será exibida no site. */
  ratio?: number;
}) {
  const supabase = createClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [paraRecortar, setParaRecortar] = useState<File | null>(null);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Permite reescolher o mesmo arquivo depois de cancelar.
    e.target.value = '';
    if (!file) return;
    setErr(null);
    if (!file.type.startsWith('image/')) {
      setErr('Escolha um arquivo de imagem.');
      return;
    }
    if (file.size > MAX_INPUT_MB * 1024 * 1024) {
      setErr(`Imagem muito grande (máx. ${MAX_INPUT_MB} MB).`);
      return;
    }
    setParaRecortar(file);
  }

  async function enviar(blob: Blob, ext: string) {
    setParaRecortar(null);
    setBusy(true);
    setErr(null);
    try {
      const path = `${prefix ? prefix + '/' : ''}${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, blob, {
        cacheControl: '3600',
        upsert: true,
        contentType: blob.type,
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
      <div
        style={{ aspectRatio: String(ratio) }}
        className="relative w-full overflow-hidden rounded-xl border border-line bg-surface-alt"
      >
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
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remover imagem"
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white/90 hover:text-red-400"
          >
            <X size={16} />
          </button>
        )}
      </div>

      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-2 text-sm text-gold hover:underline disabled:opacity-50"
        >
          <ImagePlus size={15} /> {value ? 'Trocar imagem' : 'Enviar imagem'}
        </button>
        <span className="inline-flex items-center gap-1.5 text-xs text-cream/40">
          <Crop size={13} /> você escolhe o enquadramento
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFile}
        disabled={busy}
      />

      {err && <p className="mt-1 text-sm text-red-400">{err}</p>}

      {paraRecortar && (
        <ImageCropper
          file={paraRecortar}
          ratio={ratio}
          onCancel={() => setParaRecortar(null)}
          onConfirm={enviar}
        />
      )}
    </div>
  );
}
