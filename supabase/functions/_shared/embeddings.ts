// ==========================================================================
// Embeddings — OpenAI text-embedding-3-small (1536 dims)
// ==========================================================================

const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const EMBEDDING_MODEL = "text-embedding-3-small";

export class MissingKeyError extends Error {}

/** Gera o embedding de um único texto. Retorna vetor de 1536 posições. */
export async function embedText(text: string): Promise<number[]> {
  const [vec] = await embedTexts([text]);
  return vec;
}

/**
 * Gera embeddings em lote (uma chamada à API). Preserva a ordem da entrada.
 * Lança MissingKeyError se OPENAI_API_KEY não estiver definida.
 */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    throw new MissingKeyError(
      "OPENAI_API_KEY não configurada. Defina o secret antes de usar embeddings " +
        "(supabase secrets set OPENAI_API_KEY=...).",
    );
  }

  const res = await fetch(OPENAI_EMBEDDINGS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Falha ao gerar embeddings (OpenAI ${res.status}): ${detail}`);
  }

  const json = await res.json();
  // Ordena por index para garantir alinhamento com a entrada.
  return (json.data as Array<{ index: number; embedding: number[] }>)
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding);
}
