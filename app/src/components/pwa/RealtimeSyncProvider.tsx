import { useRealtimeSync } from "@/hooks/useRealtimeSync";
import { useSync } from "@/hooks/useSync";

export function SyncInitializer() {
  useRealtimeSync();
  useSync();
  return null;
}
