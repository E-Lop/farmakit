// Edge Function: register-push
// Gestisce subscribe/unsubscribe delle push subscriptions per le notifiche.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, jsonResponse } from "../_shared/cors.ts";

interface RegisterPushRequest {
  action: "subscribe" | "unsubscribe";
  subscription?: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
  };
  endpoint?: string;
  userAgent?: string;
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

    const body: RegisterPushRequest = await req.json();

    if (body.action === "subscribe") {
      if (!body.subscription) {
        return jsonResponse({ error: "Dati subscription obbligatori" }, 400);
      }

      // Upsert subscription (gestisce re-subscribe dallo stesso device)
      const { error: upsertError } = await supabase
        .from("push_subscriptions")
        .upsert(
          {
            user_id: user.id,
            endpoint: body.subscription.endpoint,
            p256dh: body.subscription.keys.p256dh,
            auth_key: body.subscription.keys.auth,
            user_agent: body.userAgent || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id,endpoint" },
        );

      if (upsertError) throw upsertError;

      // Creare notification_preferences con defaults se non esiste
      await supabase
        .from("notification_preferences")
        .upsert(
          { user_id: user.id, enabled: true },
          { onConflict: "user_id", ignoreDuplicates: true },
        );

      return jsonResponse({ success: true });
    }

    if (body.action === "unsubscribe") {
      const endpoint = body.endpoint || body.subscription?.endpoint;
      if (!endpoint) {
        return jsonResponse({ error: "Endpoint obbligatorio" }, 400);
      }

      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", endpoint);

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Azione non valida" }, 400);
  } catch (error) {
    console.error("Errore register-push:", error);
    return jsonResponse({ error: "Errore interno del server" }, 500);
  }
});
