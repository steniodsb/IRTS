'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, Save } from 'lucide-react';
import { Button } from '@/components/ui';
import { ImageUpload } from '@/components/admin/ImageUpload';
import { createClient } from '@/lib/supabase/client';

type Credencial = { titulo: string; texto: string };
type HomeMedia = { type?: 'image' | 'video'; url?: string; caption?: string };

/** Editor de Sobre/Bio + mídia institucional da home. */
export function BioForm({ bio, homeMedia }: { bio: any; homeMedia: HomeMedia }) {
  const router = useRouter();
  const supabase = createClient();

  // --- Bio ---
  const [photoUrl, setPhotoUrl] = useState<string | null>(bio?.photo_url ?? null);
  const [name, setName] = useState<string>(bio?.name ?? '');
  const [tagline, setTagline] = useState<string>(bio?.tagline ?? '');
  const [headline, setHeadline] = useState<string>(bio?.headline ?? '');
  const [bodyText, setBodyText] = useState<string>(
    Array.isArray(bio?.body) ? bio.body.join('\n\n') : (bio?.body ?? ''),
  );
  const [credenciais, setCredenciais] = useState<Credencial[]>(
    Array.isArray(bio?.credenciais)
      ? bio.credenciais.map((c: any) => ({ titulo: c?.titulo ?? '', texto: c?.texto ?? '' }))
      : [],
  );

  // --- Home media ---
  const [mediaType, setMediaType] = useState<'image' | 'video'>(homeMedia?.type === 'video' ? 'video' : 'image');
  const [mediaUrl, setMediaUrl] = useState<string>(homeMedia?.url ?? '');
  const [mediaCaption, setMediaCaption] = useState<string>(homeMedia?.caption ?? '');

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function updateCred(i: number, patch: Partial<Credencial>) {
    setCredenciais((list) => list.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  }
  function addCred() {
    setCredenciais((list) => [...list, { titulo: '', texto: '' }]);
  }
  function removeCred(i: number) {
    setCredenciais((list) => list.filter((_, idx) => idx !== i));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const body = bodyText
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean);

    const bioValue = {
      headline: headline.trim(),
      name: name.trim(),
      tagline: tagline.trim(),
      photo_url: photoUrl ?? '',
      body,
      credenciais: credenciais
        .map((c) => ({ titulo: c.titulo.trim(), texto: c.texto.trim() }))
        .filter((c) => c.titulo || c.texto),
    };

    const mediaValue: HomeMedia = {
      type: mediaType,
      url: mediaUrl.trim(),
      caption: mediaCaption.trim(),
    };

    const { error } = await supabase
      .from('site_settings')
      .upsert(
        [
          { key: 'bio', value: bioValue },
          { key: 'home_media', value: mediaValue },
        ],
        { onConflict: 'key' },
      );

    setSaving(false);
    if (error) {
      setMsg({ ok: false, text: error.message });
      return;
    }
    setMsg({ ok: true, text: 'Salvo com sucesso.' });
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      {/* SOBRE / BIO */}
      <div className="card space-y-5 p-6">
        <div>
          <h2 className="font-serif text-xl text-cream">Sobre / Bio</h2>
          <p className="mt-1 text-sm text-cream/50">Aparece na página pública Sobre.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <ImageUpload
            bucket="public-assets"
            prefix="bio"
            label="Foto (Sobre)"
            value={photoUrl}
            onChange={setPhotoUrl}
            aspect="aspect-[4/5]"
          />

          <div className="space-y-3">
            <div>
              <label className="label">Nome</label>
              <input className="input" placeholder="Newton dos Anjos" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="label">Tagline (destaque)</label>
              <textarea className="input min-h-16" placeholder="Frase de posicionamento" value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
            <div>
              <label className="label">Headline</label>
              <input className="input" placeholder="Título da seção (opcional)" value={headline} onChange={(e) => setHeadline(e.target.value)} />
            </div>
          </div>
        </div>

        <div>
          <label className="label">Biografia (parágrafos)</label>
          <textarea
            className="input min-h-48"
            placeholder="Separe cada parágrafo com uma linha em branco."
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
          />
          <p className="mt-1 text-xs text-cream/40">Cada bloco separado por linha em branco vira um parágrafo.</p>
        </div>

        {/* Credenciais */}
        <div>
          <div className="flex items-center justify-between">
            <label className="label mb-0">Credenciais</label>
            <button type="button" onClick={addCred} className="inline-flex items-center gap-1.5 text-sm text-gold hover:underline">
              <Plus size={15} /> Adicionar
            </button>
          </div>
          <div className="mt-3 space-y-3">
            {credenciais.length === 0 && (
              <p className="text-sm text-cream/40">Nenhuma credencial. Clique em “Adicionar”.</p>
            )}
            {credenciais.map((c, i) => (
              <div key={i} className="rounded-xl border border-line bg-surface-alt p-3">
                <div className="flex items-start gap-3">
                  <div className="flex-1 space-y-2">
                    <input
                      className="input"
                      placeholder="Título (ex.: 30+ anos de atuação)"
                      value={c.titulo}
                      onChange={(e) => updateCred(i, { titulo: e.target.value })}
                    />
                    <textarea
                      className="input min-h-16"
                      placeholder="Descrição da credencial"
                      value={c.texto}
                      onChange={(e) => updateCred(i, { texto: e.target.value })}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeCred(i)}
                    className="mt-1 shrink-0 rounded-lg border border-line p-2 text-cream/50 hover:text-red-400"
                    aria-label="Remover credencial"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MÍDIA DA HOME */}
      <div className="card space-y-4 p-6">
        <div>
          <h2 className="font-serif text-xl text-cream">Mídia institucional da home</h2>
          <p className="mt-1 text-sm text-cream/50">Imagem ou vídeo exibido na página inicial.</p>
        </div>

        <div>
          <label className="label">Tipo</label>
          <select className="input" value={mediaType} onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}>
            <option value="image">Imagem</option>
            <option value="video">Vídeo (embed)</option>
          </select>
        </div>

        {mediaType === 'image' && (
          <ImageUpload
            bucket="public-assets"
            prefix="home"
            label="Imagem da home"
            value={mediaUrl || null}
            onChange={(url) => setMediaUrl(url ?? '')}
            aspect="aspect-video"
          />
        )}

        <div>
          <label className="label">{mediaType === 'video' ? 'URL do vídeo (embed YouTube/Vimeo)' : 'URL da imagem (opcional)'}</label>
          <input
            className="input"
            placeholder={mediaType === 'video' ? 'https://www.youtube.com/embed/...' : 'https://...'}
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
          />
          {mediaType === 'video' && (
            <p className="mt-1 text-xs text-cream/40">Use o link de incorporação (embed), não o link normal do vídeo.</p>
          )}
        </div>

        <div>
          <label className="label">Legenda (opcional)</label>
          <input className="input" placeholder="Texto abaixo da mídia" value={mediaCaption} onChange={(e) => setMediaCaption(e.target.value)} />
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-400' : 'text-red-400'}`}>{msg.text}</p>}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving ? 'Salvando…' : <>Salvar <Save size={16} /></>}
        </Button>
      </div>
    </form>
  );
}
