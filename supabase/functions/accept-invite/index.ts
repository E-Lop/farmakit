// Edge Function: accept-invite
// Accetta un invito tramite codice breve e aggiunge l'utente all'armadietto

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Autenticazione
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Token di autorizzazione mancante" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Non autorizzato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { shortCode } = await req.json();
    if (!shortCode) {
      return new Response(
        JSON.stringify({ error: "Codice invito obbligatorio" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Cerca invito
    const { data: inviteData, error: inviteError } = await supabaseClient
      .from("invites")
      .select("id, cabinet_id, status, expires_at")
      .eq("short_code", shortCode.toUpperCase())
      .single();

    if (inviteError || !inviteData) {
      return new Response(
        JSON.stringify({ error: "Invito non trovato" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verifica stato
    if (inviteData.status !== "pending") {
      return new Response(
        JSON.stringify({ error: "Invito già utilizzato o scaduto" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verifica scadenza
    if (new Date(inviteData.expires_at) < new Date()) {
      await supabaseClient
        .from("invites")
        .update({ status: "expired" })
        .eq("id", inviteData.id);

      return new Response(
        JSON.stringify({ error: "Invito scaduto" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verifica se già membro
    const { data: existingMember } = await supabaseClient
      .from("cabinet_members")
      .select("id")
      .eq("cabinet_id", inviteData.cabinet_id)
      .eq("user_id", user.id)
      .maybeSingle();

    // Aggiungi come editor (se non già membro)
    if (!existingMember) {
      const { error: memberError } = await supabaseClient
        .from("cabinet_members")
        .insert({
          cabinet_id: inviteData.cabinet_id,
          user_id: user.id,
          role: "editor",
        });

      if (memberError) {
        console.error("Errore aggiunta membro:", memberError);
        return new Response(
          JSON.stringify({ error: "Impossibile aggiungere il membro" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Segna invito come accettato
    await supabaseClient
      .from("invites")
      .update({
        status: "accepted",
        accepted_by: user.id,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", inviteData.id);

    return new Response(
      JSON.stringify({ success: true, cabinetId: inviteData.cabinet_id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Errore imprevisto:", error);
    return new Response(
      JSON.stringify({ error: "Errore interno del server" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
