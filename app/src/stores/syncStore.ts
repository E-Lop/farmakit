import { create } from "zustand";
import type { SyncState } from "@/types/sync";

interface SyncStore extends SyncState {
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setPendingCount: (count: number) => void;
  setLastSynced: (date: string) => void;
}

export const useSyncStore = create<SyncStore>((set) => ({
  online: navigator.onLine,
  syncing: false,
  pendingCount: 0,
  lastSyncedAt: null,
  setOnline: (online) => set({ online }),
  setSyncing: (syncing) => set({ syncing }),
  setPendingCount: (count) => set({ pendingCount: count }),
  setLastSynced: (date) => set({ lastSyncedAt: date }),
}));
