// ==========================================================================
// ingest-embeddings — Ingestão da base de conhecimento do Consultor IA (admin)
// verify_jwt = true
//
// Body:
//   { title, source?, source_type?, content }   → cria ai_documents + chunks
//   { document_id, content }                    → adiciona chunks a um doc
//
// Só admin/owner podem chamar. Faz chunking por caracteres (~3000 chars,
// overlap ~200), gera embeddings (OpenAI) e insere em ai_chunks.
// Retorna { document_id, chunks: n }.
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser, AuthError } from "../_shared/supabaseAdmin.ts";
import { embedTexts, MissingKeyError } from "../_shared/embeddings.ts";

const CHUNK_SIZE = 3000; // ~800 tokens
const CHUNK_OVERLAP = 200;

/** Divisor simples por caracteres, com sobreposição entre chunks. */
function chunkText(text: string): string[] {
  const clean = text.replace(/\r\n/g, "\n").trim();
  if (clean.length <= CHUNK_SIZE) return clean ? [clean] : [];

  const chunks: string[] = [];
  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + CHUNK_SIZE, clean.length);
    // Tenta quebrar em fronteira de parágrafo/frase para não cortar no meio.
    if (end < clean.length) {
      const slice = clean.slice(start, end);
      const lastBreak = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf("\n"),
        slice.lastIndexOf(". "),
      );
      if (lastBreak > CHUNK_SIZE * 0.5) {
        end = start + lastBreak + 1;
      }
    }
    const piece = clean.slice(start, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    start = end - CHUNK_OVERLAP;
    if (start < 0) start = 0;
  }
  return chunks;
}

/** Estimativa grosseira de tokens (~4 chars/token). */
function estimateTokens(s: string): number {
  return Math.ceil(s.length / 4);
}

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Método não permitido." }, 405);
    }

    const { user } = await requireUser(req);
    const admin = createAdminClient();

    // Verifica se é admin/owner
    const { data: profile, error: profErr } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profErr) {
      return jsonResponse(
        { error: "Falha ao verificar permissão.", detail: profErr.message },
        500,
      );
    }
    if (!profile || !["admin", "owner"].includes(profile.role)) {
      return jsonResponse({ error: "Acesso restrito a administradores." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { title, source, source_type, content } = body;
    let documentId: string | undefined = body.document_id;

    if (!content || typeof content !== "string" || !content.trim()) {
      return jsonResponse({ error: "Campo 'content' é obrigatório." }, 400);
    }
    if (!documentId && (!title || typeof title !== "string")) {
      return jsonResponse(
        { error: "Informe 'title' (para criar documento) ou 'document_id'." },
        400,
      );
    }

    // Chunking
    const pieces = chunkText(content);
    if (!pieces.length) {
      return jsonResponse({ error: "Conteúdo vazio após limpeza." }, 400);
    }

    // Embeddings (uma chamada em lote)
    let vectors: number[][];
    try {
      vectors = await embedTexts(pieces);
    } catch (e) {
      if (e instanceof MissingKeyError) {
        return jsonResponse({ error: e.message }, 500);
      }
      throw e;
    }

    // Cria o documento se necessário
    if (!documentId) {
      const { data: doc, error: docErr } = await admin
        .from("ai_documents")
        .insert({
          title,
          source: source ?? null,
          source_type: source_type ?? null,
        })
        .select("id")
        .single();
      if (docErr) {
        return jsonResponse(
          { error: "Falha ao criar documento.", detail: docErr.message },
          500,
        );
      }
      documentId = doc.id;
    } else {
      // Valida que o documento existe
      const { data: existing } = await admin
        .from("ai_documents")
        .select("id")
        .eq("id", documentId)
        .maybeSingle();
      if (!existing) {
        return jsonResponse({ error: "document_id não encontrado." }, 404);
      }
    }

    // Insere os chunks
    const rows = pieces.map((piece, i) => ({
      document_id: documentId,
      content: piece,
      embedding: vectors[i],
      tokens: estimateTokens(piece),
    }));

    const { error: insErr } = await admin.from("ai_chunks").insert(rows);
    if (insErr) {
      return jsonResponse(
        { error: "Falha ao inserir chunks.", detail: insErr.message },
        500,
      );
    }

    return jsonResponse({ document_id: documentId, chunks: rows.length });
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonResponse({ error: e.message }, 401);
    }
    console.error("ingest-embeddings erro:", e);
    return jsonResponse(
      { error: "Erro interno.", detail: String((e as Error)?.message ?? e) },
      500,
    );
  }
});
