'use client';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Check, Loader2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

/**
 * Editor de recorte. O usuário arrasta e dá zoom para escolher exatamente o
 * pedaço da imagem que vai aparecer; o recorte é feito de verdade (canvas)
 * antes do upload — e não só escondido por CSS.
 *
 * A proporção é fixa e igual à do lugar onde a imagem será exibida, para o
 * que ele enquadra ser exatamente o que aparece no site.
 */

/** Largura máxima do arquivo gerado — evita subir imagens gigantes. */
const MAX_OUTPUT_WIDTH = 1600;
/** Zoom máximo sobre o enquadramento inicial. */
const MAX_ZOOM = 4;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/** Melhor formato suportado pelo navegador (webp é bem menor que jpeg). */
function pickOutputType(): { type: string; ext: string } {
  const c = document.createElement('canvas');
  c.width = c.height = 1;
  return c.toDataURL('image/webp').startsWith('data:image/webp')
    ? { type: 'image/webp', ext: 'webp' }
    : { type: 'image/jpeg', ext: 'jpg' };
}

export function ImageCropper({
  file,
  ratio,
  onCancel,
  onConfirm,
}: {
  file: File;
  /** Proporção largura/altura do recorte (ex.: 16/9). */
  ratio: number;
  onCancel: () => void;
  onConfirm: (blob: Blob, ext: string) => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [boxW, setBoxW] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [gerando, setGerando] = useState(false);

  // ---- carrega a imagem escolhida -----------------------------------------
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => setImg(image);
    image.onerror = () => setErro('Não foi possível ler esta imagem.');
    image.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ---- mede a área de recorte ---------------------------------------------
  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const medir = () => setBoxW(el.clientWidth);
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  const boxH = boxW / ratio;
  // Escala que faz a imagem cobrir toda a área (nada de faixa vazia).
  const baseScale = img ? Math.max(boxW / img.naturalWidth, boxH / img.naturalHeight) : 1;
  const scale = baseScale * zoom;
  const dw = img ? img.naturalWidth * scale : 0;
  const dh = img ? img.naturalHeight * scale : 0;
  const maxX = Math.max(0, (dw - boxW) / 2);
  const maxY = Math.max(0, (dh - boxH) / 2);

  // Ao mudar o zoom (ou a medida da caixa), reencaixa o deslocamento nos limites.
  useEffect(() => {
    setPos((p) => ({ x: clamp(p.x, -maxX, maxX), y: clamp(p.y, -maxY, maxY) }));
  }, [maxX, maxY]);

  // ---- arrastar -----------------------------------------------------------
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    if (!img) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, ox: pos.x, oy: pos.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    setPos({
      x: clamp(d.ox + (e.clientX - d.px), -maxX, maxX),
      y: clamp(d.oy + (e.clientY - d.py), -maxY, maxY),
    });
  }
  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  }
  function onWheel(e: React.WheelEvent) {
    if (!img) return;
    setZoom((z) => clamp(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 1, MAX_ZOOM));
  }

  function reset() {
    setZoom(1);
    setPos({ x: 0, y: 0 });
  }

  // ---- gera o recorte -----------------------------------------------------
  const confirmar = useCallback(async () => {
    if (!img || !boxW) return;
    setGerando(true);
    setErro(null);
    try {
      // Canto superior esquerdo da imagem dentro da área visível (em px de tela).
      const imgLeft = boxW / 2 + pos.x - dw / 2;
      const imgTop = boxH / 2 + pos.y - dh / 2;

      // Região equivalente nas coordenadas originais da imagem.
      const sx = clamp(-imgLeft / scale, 0, img.naturalWidth);
      const sy = clamp(-imgTop / scale, 0, img.naturalHeight);
      const sw = clamp(boxW / scale, 1, img.naturalWidth - sx);
      const sh = clamp(boxH / scale, 1, img.naturalHeight - sy);

      // Nunca amplia além do que existe no original.
      const outW = Math.round(Math.min(MAX_OUTPUT_WIDTH, sw));
      const outH = Math.round(outW / ratio);

      const canvas = document.createElement('canvas');
      canvas.width = outW;
      canvas.height = outH;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas indisponível neste navegador.');
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

      const { type, ext } = pickOutputType();
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, type, 0.9),
      );
      if (!blob) throw new Error('Falha ao gerar a imagem recortada.');
      onConfirm(blob, ext);
    } catch (e: any) {
      setErro(e?.message ?? 'Falha ao recortar a imagem.');
      setGerando(false);
    }
  }, [img, boxW, boxH, dw, dh, pos, scale, ratio, onConfirm]);

  // Esc fecha
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      <div className="card relative w-full max-w-2xl p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="font-serif text-xl text-cream">Enquadrar imagem</p>
            <p className="mt-0.5 text-sm text-cream/50">
              Arraste para posicionar e use o zoom. A área clara é exatamente o que vai aparecer.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Fechar"
            className="rounded-full p-1 text-cream/60 transition hover:text-cream"
          >
            <X size={20} />
          </button>
        </div>

        {/* Área de recorte */}
        <div
          ref={boxRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          style={{ aspectRatio: String(ratio) }}
          className="relative w-full touch-none select-none overflow-hidden rounded-xl border border-line bg-surface-alt"
        >
          {img && boxW > 0 ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.src}
                alt=""
                draggable={false}
                style={{
                  position: 'absolute',
                  width: dw,
                  height: dh,
                  left: boxW / 2 + pos.x - dw / 2,
                  top: boxH / 2 + pos.y - dh / 2,
                  maxWidth: 'none',
                  cursor: drag.current ? 'grabbing' : 'grab',
                }}
              />
              {/* Guias de terços — ajudam a centralizar rosto/logo */}
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute inset-y-0 left-1/3 w-px bg-white/25" />
                <div className="absolute inset-y-0 left-2/3 w-px bg-white/25" />
                <div className="absolute inset-x-0 top-1/3 h-px bg-white/25" />
                <div className="absolute inset-x-0 top-2/3 h-px bg-white/25" />
              </div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-cream/40">
              {erro ? erro : <Loader2 className="animate-spin" />}
            </div>
          )}
        </div>

        {/* Zoom */}
        <div className="mt-4 flex items-center gap-3">
          <ZoomOut size={16} className="shrink-0 text-cream/50" />
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            aria-label="Zoom"
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-surface-alt accent-gold"
          />
          <ZoomIn size={16} className="shrink-0 text-cream/50" />
          <button
            type="button"
            onClick={reset}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm text-cream/60 transition hover:text-gold"
          >
            <RotateCcw size={14} /> Reiniciar
          </button>
        </div>

        {erro && img && <p className="mt-3 text-sm text-red-400">{erro}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="btn-ghost">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={!img || gerando}
            className="btn-gold"
          >
            {gerando ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
            {gerando ? 'Enviando…' : 'Aplicar e enviar'}
          </button>
        </div>
      </div>
    </div>
  );
}
