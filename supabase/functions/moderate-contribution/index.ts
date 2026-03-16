// Edge Function: moderate-contribution
// Approva o rifiuta una contribuzione community (solo admin).
// Se approvata, applica i dati al catalogo medicines.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { applyToMedicines } from "../_shared/medicines.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return jsonResponse({ error: "Token di autorizzazione mancante" }, 401);
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return jsonResponse({ error: "Non autorizzato" }, 401);
    }

    // Verifica admin (app_metadata disponibile da getUser)
    const isAdmin =
      (user as { app_metadata?: { is_admin?: boolean } }).app_metadata
        ?.is_admin === true;
    if (!isAdmin) {
      return jsonResponse({ error: "Accesso riservato agli admin" }, 403);
    }

    const { contribution_id, action } = await req.json();
    if (!contribution_id || !["approve", "reject"].includes(action)) {
      return jsonResponse(
        { error: "contribution_id e action (approve/reject) obbligatori" },
        400,
      );
    }

    // Carica la contribuzione
    const { data: contribution, error: fetchError } = await supabase
      .from("community_contributions")
      .select("*")
      .eq("id", contribution_id)
      .single();

    if (fetchError || !contribution) {
      return jsonResponse({ error: "Contribuzione non trovata" }, 404);
    }

    if (contribution.status !== "pending") {
      return jsonResponse({ error: "Contribuzione già moderata" }, 400);
    }

    const newStatus = action === "approve" ? "approved" : "rejected";

    // Aggiorna status
    const { error: updateError } = await supabase
      .from("community_contributions")
      .update({ status: newStatus })
      .eq("id", contribution_id);

    if (updateError) throw updateError;

    // Se approvata, applica al catalogo
    if (action === "approve" && contribution.data?.name) {
      await applyToMedicines(supabase, contribution.data);
    }

    return jsonResponse({ success: true, status: newStatus });
  } catch (error) {
    console.error("Errore moderate-contribution:", error);
    return jsonResponse({ error: "Errore interno del server" }, 500);
  }
});
