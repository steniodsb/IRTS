// ==========================================================================
// consultor-ia — Consultor IA (RAG) da IRTS / NDA Academy
// verify_jwt = true
//
// Fluxo:
//  1. CORS + auth (identifica o usuário pelo Bearer JWT).
//  2. Embed da pergunta (OpenAI text-embedding-3-small).
//  3. RPC match_ai_chunks (top 6, threshold 0.5) via service-role.
//  4. Monta prompt em PT-BR: responder SÓ com base no contexto da firma.
//  5. Anthropic Messages API (modelo de IA_MODEL, default claude-sonnet-5).
//  6. Persiste conversa + mensagens (user/assistant com citations).
//  7. Retorna { answer, citations, conversation_id }.
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser, AuthError } from "../_shared/supabaseAdmin.ts";
import { embedText, MissingKeyError } from "../_shared/embeddings.ts";

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

interface Chunk {
  id: string;
  document_id: string | null;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Método não permitido." }, 405);
    }

    // 1. Auth
    const { user } = await requireUser(req);

    // Body
    const { question, conversation_id } = await req.json().catch(() => ({}));
    if (!question || typeof question !== "string" || !question.trim()) {
      return jsonResponse({ error: "Campo 'question' é obrigatório." }, 400);
    }

    const anthropicKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!anthropicKey) {
      return jsonResponse(
        {
          error:
            "ANTHROPIC_API_KEY não configurada. Defina o secret antes de usar o " +
            "Consultor IA (supabase secrets set ANTHROPIC_API_KEY=...).",
        },
        500,
      );
    }

    const admin = createAdminClient();

    // 2. Embed da pergunta
    let queryEmbedding: number[];
    try {
      queryEmbedding = await embedText(question);
    } catch (e) {
      if (e instanceof MissingKeyError) {
        return jsonResponse({ error: e.message }, 500);
      }
      throw e;
    }

    // 3. Busca semântica
    const { data: chunks, error: matchErr } = await admin.rpc("match_ai_chunks", {
      query_embedding: queryEmbedding,
      match_count: 6,
      similarity_threshold: 0.5,
    });
    if (matchErr) {
      return jsonResponse(
        { error: "Falha na busca de contexto.", detail: matchErr.message },
        500,
      );
    }

    const retrieved: Chunk[] = (chunks ?? []) as Chunk[];

    // 4. Monta o contexto e o system prompt em PT-BR
    const contextBlock = retrieved.length
      ? retrieved
          .map((c, i) => `[Trecho ${i + 1}]\n${c.content}`)
          .join("\n\n---\n\n")
      : "(Nenhum trecho relevante foi encontrado na base de conhecimento.)";

    const systemPrompt = [
      "Você é o Consultor IA da IRTS / NDA Academy.",
      "Responda em português do Brasil, de forma clara, técnica e cordial.",
      "REGRA CRÍTICA: use SOMENTE as informações contidas no CONTEXTO abaixo,",
      "que representa o conteúdo oficial da firma (cursos, ebooks, materiais).",
      "Se a resposta não estiver no contexto, diga honestamente que não possui",
      "essa informação na base de conhecimento e sugira procurar o suporte.",
      "Nunca invente dados, números ou fontes. Não use conhecimento externo.",
      "",
      "CONTEXTO:",
      contextBlock,
    ].join("\n");

    // 5. Anthropic Messages API
    const model = Deno.env.get("IA_MODEL") || "claude-sonnet-5";
    const anthropicRes = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: "user", content: question }],
      }),
    });

    if (!anthropicRes.ok) {
      const detail = await anthropicRes.text();
      return jsonResponse(
        {
          error: "Falha ao consultar o modelo de IA.",
          detail: `Anthropic ${anthropicRes.status}: ${detail}`,
        },
        502,
      );
    }

    const aiJson = await anthropicRes.json();
    const answer: string = Array.isArray(aiJson.content)
      ? aiJson.content
          .filter((b: { type: string }) => b.type === "text")
          .map((b: { text: string }) => b.text)
          .join("\n")
          .trim()
      : "";

    const citations = retrieved.map((c) => ({
      content: c.content,
      document_id: c.document_id,
      similarity: c.similarity,
    }));

    // 6. Persistência
    let convId = conversation_id as string | undefined;
    if (!convId) {
      const title = question.trim().slice(0, 60);
      const { data: conv, error: convErr } = await admin
        .from("ai_conversations")
        .insert({ user_id: user.id, title })
        .select("id")
        .single();
      if (convErr) {
        return jsonResponse(
          { error: "Falha ao criar conversa.", detail: convErr.message },
          500,
        );
      }
      convId = conv.id;
    }

    const { error: msgErr } = await admin.from("ai_messages").insert([
      { conversation_id: convId, role: "user", content: question, citations: [] },
      {
        conversation_id: convId,
        role: "assistant",
        content: answer,
        citations,
      },
    ]);
    if (msgErr) {
      // Não falha a resposta ao usuário por erro de persistência; apenas loga.
      console.error("Erro ao salvar mensagens:", msgErr.message);
    }

    // 7. Resposta
    return jsonResponse({ answer, citations, conversation_id: convId });
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonResponse({ error: e.message }, 401);
    }
    console.error("consultor-ia erro:", e);
    return jsonResponse(
      { error: "Erro interno.", detail: String((e as Error)?.message ?? e) },
      500,
    );
  }
});
