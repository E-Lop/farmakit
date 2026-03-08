import { useEffect, useCallback } from "react";
import { useSyncStore } from "@/stores/syncStore";
import { processPendingMutations, getPendingMutations } from "@/lib/sync";

export function useSync() {
  const { online, syncing, pendingCount, lastSyncedAt, setOnline, setSyncing, setPendingCount, setLastSynced } =
    useSyncStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [setOnline]);

  useEffect(() => {
    getPendingMutations().then((m) => setPendingCount(m.length));
  }, [setPendingCount]);

  const syncNow = useCallback(async () => {
    if (!online || syncing) return;
    setSyncing(true);
    try {
      await processPendingMutations();
      const remaining = await getPendingMutations();
      setPendingCount(remaining.length);
      setLastSynced(new Date().toISOString());
    } finally {
      setSyncing(false);
    }
  }, [online, syncing, setSyncing, setPendingCount, setLastSynced]);

  useEffect(() => {
    if (online && pendingCount > 0) {
      syncNow();
    }
  }, [online, pendingCount, syncNow]);

  return { online, syncing, pendingCount, lastSyncedAt, syncNow };
}
