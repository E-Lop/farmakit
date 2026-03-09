import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useSync } from "@/hooks/useSync";

export function RealtimeSyncProvider() {
  useRealtimeSync();
  useSync();
  return null;
}
