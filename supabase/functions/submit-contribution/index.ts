// Edge Function: submit-contribution
// Gestisce le contribuzioni community al catalogo farmaci.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { contribution_type, data } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Non autenticato" }), { status: 401 });
  }

  const { data: contribution, error } = await supabase
    .from("community_contributions")
    .insert({
      user_id: user.id,
      contribution_type,
      data,
    })
    .select()
    .single();

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  return new Response(JSON.stringify({ data: contribution }));
});
