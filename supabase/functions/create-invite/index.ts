// Edge Function: create-invite
// Genera un codice invito breve per condivisione armadietto (solo owner)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function randomString(alphabet: string, length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function generateShortCode(): string {
  return randomString("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);
}

function generateToken(): string {
  return randomString(
    "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
    32,
  );
}

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

    const { cabinetId } = await req.json();
    if (!cabinetId) {
      return new Response(
        JSON.stringify({ error: "cabinetId è obbligatorio" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verifica che l'utente sia owner dell'armadietto
    const { data: memberData, error: memberError } = await supabaseClient
      .from("cabinet_members")
      .select("role")
      .eq("cabinet_id", cabinetId)
      .eq("user_id", user.id)
      .single();

    if (memberError || !memberData || memberData.role !== "owner") {
      return new Response(
        JSON.stringify({
          error: "Solo il proprietario può creare inviti",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Genera codice unico con gestione collisioni
    let shortCode = "";
    for (let attempts = 0; attempts < 3; attempts++) {
      shortCode = generateShortCode();
      const { data: existing } = await supabaseClient
        .from("invites")
        .select("id")
        .eq("short_code", shortCode)
        .maybeSingle();

      if (!existing) break;
      if (attempts === 2) {
        return new Response(
          JSON.stringify({ error: "Impossibile generare un codice unico" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    // Scadenza: 7 giorni
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { error: inviteError } = await supabaseClient
      .from("invites")
      .insert({
        cabinet_id: cabinetId,
        short_code: shortCode,
        token: generateToken(),
        created_by: user.id,
        status: "pending",
        expires_at: expiresAt.toISOString(),
      });

    if (inviteError) {
      console.error("Errore creazione invito:", inviteError);
      return new Response(
        JSON.stringify({ error: "Impossibile creare l'invito" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ success: true, shortCode }),
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
