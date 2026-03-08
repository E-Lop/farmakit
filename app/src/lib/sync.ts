import { get, set, del, keys } from "idb-keyval";
import type { PendingMutation } from "@/types/sync";
import { supabase } from "./supabase";

const PENDING_PREFIX = "pending:";

export async function queueMutation(mutation: Omit<PendingMutation, "id" | "created_at" | "retries">): Promise<void> {
  const id = crypto.randomUUID();
  const pending: PendingMutation = {
    ...mutation,
    id,
    created_at: new Date().toISOString(),
    retries: 0,
  };
  await set(`${PENDING_PREFIX}${id}`, pending);
}

export async function getPendingMutations(): Promise<PendingMutation[]> {
  const allKeys = await keys();
  const pendingKeys = allKeys.filter((k) => String(k).startsWith(PENDING_PREFIX));
  const mutations: PendingMutation[] = [];
  for (const key of pendingKeys) {
    const val = await get<PendingMutation>(key);
    if (val) mutations.push(val);
  }
  return mutations.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function processPendingMutations(): Promise<number> {
  const mutations = await getPendingMutations();
  let processed = 0;

  for (const mutation of mutations) {
    try {
      const method = mutation.operation === "DELETE" ? "delete" : mutation.operation === "INSERT" ? "insert" : "update";
      const { error } = await supabase.from(mutation.table)[method](mutation.payload as never);
      if (error) throw error;
      await del(`${PENDING_PREFIX}${mutation.id}`);
      processed++;
    } catch {
      await set(`${PENDING_PREFIX}${mutation.id}`, {
        ...mutation,
        retries: mutation.retries + 1,
      });
    }
  }

  return processed;
}
