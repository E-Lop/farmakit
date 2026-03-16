// Edge Function: submit-contribution
// Gestisce le contribuzioni community al catalogo farmaci.
// Auto-approva per admin e per consenso pesato (soglia 3.0).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";
import { applyToMedicines } from "../_shared/medicines.ts";

const CONSENSUS_THRESHOLD = 3.0;

interface ContributionData {
  name?: string;
  barcode?: string;
  active_ingredient?: string;
  manufacturer?: string;
  medicine_id?: string;
  correction_field?: string;
  correction_value?: string;
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

    const {
      contribution_type,
      data,
    }: { contribution_type: string; data: ContributionData } = await req.json();

    // Verifica se l'utente è admin (app_metadata disponibile da getUser)
    const isAdmin =
      (user as { app_metadata?: { is_admin?: boolean } }).app_metadata
        ?.is_admin === true;

    // Inserisci contribuzione
    const initialStatus = isAdmin ? "approved" : "pending";
    const { data: contribution, error } = await supabase
      .from("community_contributions")
      .insert({
        user_id: user.id,
        contribution_type,
        data,
        status: initialStatus,
      })
      .select()
      .single();

    if (error) return jsonResponse({ error: error.message }, 400);

    // Se admin: applica subito al catalogo medicines
    if (isAdmin && contribution_type === "new_medicine" && data.name) {
      await applyToMedicines(supabase, data);
      return jsonResponse({ data: contribution });
    }

    // Se non admin: verifica consenso pesato
    if (!isAdmin && data.name) {
      const normalizedName = normalizeName(data.name);
      const { data: clusterWeight } = await supabase.rpc(
        "contribution_cluster_weight",
        {
          p_contribution_type: contribution_type,
          p_barcode: data.barcode || null,
          p_normalized_name: normalizedName,
        },
      );

      if (
        typeof clusterWeight === "number" &&
        clusterWeight >= CONSENSUS_THRESHOLD
      ) {
        // Auto-approvazione per consenso: approva tutte le contribuzioni coerenti
        await supabase
          .from("community_contributions")
          .update({ status: "approved" })
          .eq("contribution_type", contribution_type)
          .eq("status", "pending")
          .or(
            data.barcode
              ? `data->barcode.eq.${data.barcode}`
              : `data->name.ilike.%${normalizedName}%`,
          );

        // Applica al catalogo
        await applyToMedicines(supabase, data);

        // Aggiorna la contribuzione appena inserita per restituirla con status corretto
        contribution.status = "approved";
      }
    }

    return jsonResponse({ data: contribution });
  } catch (error) {
    console.error("Errore submit-contribution:", error);
    return jsonResponse({ error: "Errore interno del server" }, 500);
  }
});
