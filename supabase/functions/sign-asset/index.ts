// ==========================================================================
// sign-asset — gera URLs assinadas para assets protegidos
// verify_jwt = true
//
// Body: { bucket, path, course_id?, library_item_id? }
//   bucket 'course-videos' → exige has_course_access (matrícula/curso grátis/plano)
//   bucket 'library'       → exige item.is_free OU assinatura ativa
//   bucket 'certificates'  → o certificado (pelo path/course) precisa ser do usuário
//
// Retorna { url } (válida ~3600s) ou 403 se não autorizado.
// ==========================================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCors, jsonResponse } from "../_shared/cors.ts";
import { createAdminClient, requireUser, AuthError } from "../_shared/supabaseAdmin.ts";

const ALLOWED_BUCKETS = ["course-videos", "library", "certificates"];
const SIGNED_TTL = 3600; // segundos

serve(async (req) => {
  const preflight = handleCors(req);
  if (preflight) return preflight;

  try {
    if (req.method !== "POST") {
      return jsonResponse({ error: "Método não permitido." }, 405);
    }

    const { user } = await requireUser(req);
    const admin = createAdminClient();

    const { bucket, path, course_id, library_item_id } = await req
      .json()
      .catch(() => ({}));

    if (!bucket || !ALLOWED_BUCKETS.includes(bucket)) {
      return jsonResponse(
        { error: `bucket inválido. Use um de: ${ALLOWED_BUCKETS.join(", ")}.` },
        400,
      );
    }
    if (!path || typeof path !== "string") {
      return jsonResponse({ error: "Campo 'path' é obrigatório." }, 400);
    }

    // ------------------------------------------------------------
    // Verificação de acesso por tipo de bucket
    // ------------------------------------------------------------
    let allowed = false;

    if (bucket === "course-videos") {
      if (!course_id) {
        return jsonResponse(
          { error: "Campo 'course_id' é obrigatório para course-videos." },
          400,
        );
      }
      const { data, error } = await admin.rpc("has_course_access", {
        uid: user.id,
        cid: course_id,
      });
      if (error) {
        return jsonResponse(
          { error: "Falha ao verificar acesso ao curso.", detail: error.message },
          500,
        );
      }
      allowed = data === true;
    } else if (bucket === "library") {
      if (!library_item_id) {
        return jsonResponse(
          { error: "Campo 'library_item_id' é obrigatório para library." },
          400,
        );
      }
      const { data: item } = await admin
        .from("library_items")
        .select("is_free, required_plan_id")
        .eq("id", library_item_id)
        .maybeSingle();
      if (!item) {
        return jsonResponse({ error: "Item da biblioteca não encontrado." }, 404);
      }
      if (item.is_free) {
        allowed = true;
      } else {
        const { data: hasSub } = await admin.rpc("has_active_subscription", {
          uid: user.id,
        });
        allowed = hasSub === true;
      }
    } else if (bucket === "certificates") {
      // O certificado precisa pertencer ao usuário. Verifica por course_id
      // (se enviado) ou pelo próprio path (que costuma conter o code/id).
      let query = admin
        .from("certificates")
        .select("id, pdf_url, code")
        .eq("user_id", user.id);
      if (course_id) query = query.eq("course_id", course_id);
      const { data: certs } = await query;
      allowed = !!certs?.some(
        (c) => path.includes(c.code) || (c.pdf_url && path.includes(c.pdf_url)) || !!course_id,
      );
    }

    if (!allowed) {
      return jsonResponse(
        { error: "Você não tem acesso a este recurso." },
        403,
      );
    }

    // ------------------------------------------------------------
    // Gera a URL assinada
    // ------------------------------------------------------------
    const { data: signed, error: signErr } = await admin.storage
      .from(bucket)
      .createSignedUrl(path, SIGNED_TTL);

    if (signErr || !signed?.signedUrl) {
      return jsonResponse(
        { error: "Falha ao assinar URL.", detail: signErr?.message },
        500,
      );
    }

    return jsonResponse({ url: signed.signedUrl, expires_in: SIGNED_TTL });
  } catch (e) {
    if (e instanceof AuthError) {
      return jsonResponse({ error: e.message }, 401);
    }
    console.error("sign-asset erro:", e);
    return jsonResponse(
      { error: "Erro interno.", detail: String((e as Error)?.message ?? e) },
      500,
    );
  }
});
