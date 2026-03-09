import { useEffect, useCallback } from "react";
import { onlineManager } from "@tanstack/react-query";
import { useSyncStore } from "@/stores/syncStore";
import { processPendingMutations, getPendingMutations } from "@/lib/sync";

export function useSync() {
  const { online, pendingCount, setOnline, setSyncing, setPendingCount, setLastSynced } =
    useSyncStore();

  // Unica fonte di verità per lo stato online: onlineManager di React Query
  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    onlineManager.setEventListener((setRQOnline) => {
      const onlineHandler = () => { setRQOnline(true); handleOnline(); };
      const offlineHandler = () => { setRQOnline(false); handleOffline(); };
      window.addEventListener("online", onlineHandler);
      window.addEventListener("offline", offlineHandler);
      return () => {
        window.removeEventListener("online", onlineHandler);
        window.removeEventListener("offline", offlineHandler);
      };
    });
  }, [setOnline]);

  useEffect(() => {
    getPendingMutations().then((m) => setPendingCount(m.length));
  }, [setPendingCount]);

  const syncNow = useCallback(async () => {
    if (!useSyncStore.getState().online || useSyncStore.getState().syncing) return;
    setSyncing(true);
    try {
      await processPendingMutations();
      const remaining = await getPendingMutations();
      setPendingCount(remaining.length);
      setLastSynced(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  }, [setSyncing, setPendingCount, setLastSynced]);

  useEffect(() => {
    if (online && pendingCount > 0) {
      syncNow();
    }
  }, [online, pendingCount, syncNow]);

  return { online, syncing: useSyncStore((s) => s.syncing), pendingCount, lastSyncedAt: useSyncStore((s) => s.lastSyncedAt), syncNow };
}
