import { supabase } from "./supabase";

const FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

async function invokeFunction<T>(name: string, body: unknown): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Non autenticato");

  const response = await fetch(`${FUNCTIONS_URL}/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `Errore ${name}`);
  return data as T;
}

export async function createInvite(cabinetId: string): Promise<string> {
  const data = await invokeFunction<{ shortCode: string }>("create-invite", {
    cabinetId,
  });
  return data.shortCode;
}

export async function acceptInvite(
  shortCode: string,
): Promise<{ cabinetId: string }> {
  const data = await invokeFunction<{ cabinetId: string }>("accept-invite", {
    shortCode: shortCode.toUpperCase(),
  });
  return { cabinetId: data.cabinetId };
}
