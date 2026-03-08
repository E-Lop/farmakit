// Edge Function: send-expiry-notifications
// Invia notifiche per farmaci in scadenza.
// Da schedulare con pg_cron o invocazione esterna (es. cron Netlify/GitHub Actions).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // Trova farmaci in scadenza nei prossimi N giorni
  const { data: expiring, error } = await supabase
    .from("user_medicines")
    .select("*, cabinet:cabinets(name, cabinet_members(user_id))")
    .not("expiry_date", "is", null)
    .lte("expiry_date", new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0])
    .gte("expiry_date", new Date().toISOString().split("T")[0]);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  // TODO: inviare notifiche push / email agli utenti interessati
  return new Response(
    JSON.stringify({
      message: `Trovati ${expiring?.length ?? 0} farmaci in scadenza`,
      data: expiring,
    }),
  );
});
