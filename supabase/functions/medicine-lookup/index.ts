// Edge Function: medicine-lookup
// Cerca un farmaco nel catalogo per barcode o nome.
// Utilizzata dal client per lookup offline-first con fallback server.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  const { barcode, query } = await req.json();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: req.headers.get("Authorization")! } } },
  );

  if (barcode) {
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .eq("barcode", barcode)
      .maybeSingle();

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ data }));
  }

  if (query && query.length >= 2) {
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .or(`name.ilike.%${query}%,active_ingredient.ilike.%${query}%`)
      .limit(20);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
    return new Response(JSON.stringify({ data }));
  }

  return new Response(JSON.stringify({ error: "Parametro barcode o query richiesto" }), { status: 400 });
});
