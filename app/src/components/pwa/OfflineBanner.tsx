import { useSyncStore } from "@/stores/syncStore";
import { WifiOff, RefreshCw } from "lucide-react";

export function OfflineBanner() {
  const { online, syncing, pendingCount } = useSyncStore();

  if (online && !syncing && pendingCount === 0) return null;

  return (
    <div className="flex items-center justify-center gap-2 px-4 py-1.5 text-xs font-medium">
      {!online && (
        <span className="flex items-center gap-1 text-amber-600">
          <WifiOff className="h-3.5 w-3.5" />
          Sei offline
        </span>
      )}
      {syncing && (
        <span className="flex items-center gap-1 text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          Sincronizzazione...
        </span>
      )}
      {!syncing && pendingCount > 0 && (
        <span className="text-muted-foreground">
          {pendingCount} modific{pendingCount === 1 ? "a" : "he"} in attesa
        </span>
      )}
    </div>
  );
}
