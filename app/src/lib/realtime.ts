import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

// --- Deduplication tracker ---

const DEDUP_WINDOW_MS = 10_000;

interface TrackedMutation {
  type: string;
  timestamp: number;
}

export class RecentMutationsTracker {
  private mutations = new Map<string, TrackedMutation>();

  track(id: string, type: string): void {
    this.mutations.set(id, { type, timestamp: Date.now() });
    setTimeout(() => this.mutations.delete(id), DEDUP_WINDOW_MS);
  }

  wasRecentlyMutated(id: string, type: string): boolean {
    const entry = this.mutations.get(id);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > DEDUP_WINDOW_MS) {
      this.mutations.delete(id);
      return false;
    }
    return entry.type === type;
  }
}

export const mutationTracker = new RecentMutationsTracker();

// --- Query keys ---

export const medicineKeys = {
  lists: () => ["user-medicines"] as const,
  list: (cabinetId: string) => ["user-medicines", cabinetId] as const,
};

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

// --- User medicines handlers ---

export function handleMedicineInsert(
  _payload: RealtimePayload<UserMedicineRow>,
  queryClient: QueryClient,
): void {
  queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });
}

export function handleMedicineUpdate(
  payload: RealtimePayload<UserMedicineRow>,
  queryClient: QueryClient,
): void {
  const updated = payload.new;
  if (mutationTracker.wasRecentlyMutated(updated.id, "UPDATE")) return;
  queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });
}

export function handleMedicineDelete(
  payload: RealtimePayload<UserMedicineRow>,
  queryClient: QueryClient,
): void {
  const deleted = payload.old;
  if (deleted.id && mutationTracker.wasRecentlyMutated(deleted.id, "DELETE")) return;
  queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });
  const name = deleted.custom_name || "Un farmaco";
  toast.info(`${name} è stato eliminato da un altro utente`);
}

export function handleMedicineRealtimeEvent(
  payload: RealtimePayload<UserMedicineRow>,
  queryClient: QueryClient,
): void {
  switch (payload.eventType) {
    case "INSERT":
      handleMedicineInsert(payload, queryClient);
      break;
    case "UPDATE":
      handleMedicineUpdate(payload, queryClient);
      break;
    case "DELETE":
      handleMedicineDelete(payload, queryClient);
      break;
  }
}

// --- Cabinet members handlers ---

export function handleCabinetMemberInsert(
  payload: RealtimePayload<CabinetMemberRow>,
  queryClient: QueryClient,
  currentUserId: string,
): void {
  if (payload.new.user_id === currentUserId) return;
  queryClient.invalidateQueries({ queryKey: ["cabinets"] });
  queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });
  toast.info("Un nuovo membro si è unito all'armadietto");
}

export function handleCabinetMemberDelete(
  payload: RealtimePayload<CabinetMemberRow>,
  queryClient: QueryClient,
  currentUserId: string,
): void {
  if (payload.old.user_id === currentUserId) {
    toast.error("Sei stato rimosso da questo armadietto");
    queryClient.clear();
    setTimeout(() => {
      window.location.href = "/";
    }, 2000);
    return;
  }
  queryClient.invalidateQueries({ queryKey: ["cabinets"] });
  queryClient.invalidateQueries({ queryKey: medicineKeys.lists() });
  toast.info("Un membro ha lasciato l'armadietto");
}

export function handleCabinetMemberEvent(
  payload: RealtimePayload<CabinetMemberRow>,
  queryClient: QueryClient,
  currentUserId: string,
): void {
  switch (payload.eventType) {
    case "INSERT":
      handleCabinetMemberInsert(payload, queryClient, currentUserId);
      break;
    case "DELETE":
      handleCabinetMemberDelete(payload, queryClient, currentUserId);
      break;
  }
}
