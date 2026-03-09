import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { medicineKeys, cabinetKeys } from "./queryKeys";

// --- Deduplication tracker ---

const DEDUP_WINDOW_MS = 10_000;

interface TrackedMutation {
  type: string;
  timestamp: number;
  timerId: ReturnType<typeof setTimeout>;
}

export class RecentMutationsTracker {
  private mutations = new Map<string, TrackedMutation>();

  track(id: string, type: string): void {
    const existing = this.mutations.get(id);
    if (existing) clearTimeout(existing.timerId);
    const timerId = setTimeout(() => this.mutations.delete(id), DEDUP_WINDOW_MS);
    this.mutations.set(id, { type, timestamp: Date.now(), timerId });
  }

  wasRecentlyMutated(id: string, type: string): boolean {
    const entry = this.mutations.get(id);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > DEDUP_WINDOW_MS) {
      clearTimeout(entry.timerId);
      this.mutations.delete(id);
      return false;
    }
    return entry.type === type;
  }
}

export const mutationTracker = new RecentMutationsTracker();

// --- Realtime payload types ---

interface RealtimePayload<T = Record<string, unknown>> {
  eventType: "INSERT" | "UPDATE" | "DELETE";
  new: T;
  old: T;
}

interface UserMedicineRow {
  id: string;
  cabinet_id: string;
  custom_name?: string;
  [key: string]: unknown;
}

interface CabinetMemberRow {
  user_id: string;
  cabinet_id: string;
  [key: string]: unknown;
}

// --- User medicines handler ---

export function handleMedicineRealtimeEvent(
  payload: RealtimePayload<UserMedicineRow>,
  queryClient: QueryClient,
): void {
  const record = payload.eventType === "DELETE" ? payload.old : payload.new;

  if (record.id && mutationTracker.wasRecentlyMutated(record.id, payload.eventType)) {
    return;
  }

  if (record.cabinet_id) {
    queryClient.invalidateQueries({ queryKey: medicineKeys.list(record.cabinet_id) });
  } else {
    queryClient.invalidateQueries({ queryKey: medicineKeys.all() });
  }

  if (payload.eventType === "DELETE") {
    const name = record.custom_name || "Un farmaco";
    toast.info(`${name} è stato eliminato da un altro utente`);
  }
}

// --- Cabinet members handler ---

export function handleCabinetMemberEvent(
  payload: RealtimePayload<CabinetMemberRow>,
  queryClient: QueryClient,
  currentUserId: string,
): void {
  const record = payload.eventType === "DELETE" ? payload.old : payload.new;

  if (payload.eventType === "INSERT") {
    if (record.user_id === currentUserId) return;
    queryClient.invalidateQueries({ queryKey: cabinetKeys.all() });
    queryClient.invalidateQueries({ queryKey: medicineKeys.all() });
    toast.info("Un nuovo membro si è unito all'armadietto");
    return;
  }

  if (payload.eventType === "DELETE") {
    if (record.user_id === currentUserId) {
      toast.error("Sei stato rimosso da questo armadietto");
      queryClient.invalidateQueries({ queryKey: cabinetKeys.all() });
      if (record.cabinet_id) {
        queryClient.removeQueries({ queryKey: medicineKeys.list(record.cabinet_id) });
      }
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
      return;
    }
    queryClient.invalidateQueries({ queryKey: cabinetKeys.all() });
    queryClient.invalidateQueries({ queryKey: medicineKeys.all() });
    toast.info("Un membro ha lasciato l'armadietto");
  }
}
