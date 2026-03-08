export interface PendingMutation {
  id: string;
  table: string;
  operation: "INSERT" | "UPDATE" | "DELETE";
  payload: Record<string, unknown>;
  created_at: string;
  retries: number;
}

export interface SyncState {
  online: boolean;
  syncing: boolean;
  pendingCount: number;
  lastSyncedAt: string | null;
}
