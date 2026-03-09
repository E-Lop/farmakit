import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import { handleMedicineRealtimeEvent, handleCabinetMemberEvent } from "@/lib/realtime";

export function useRealtimeSync() {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("farmakit-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_medicines" },
        (payload) => {
          handleMedicineRealtimeEvent(
            payload as unknown as Parameters<typeof handleMedicineRealtimeEvent>[0],
            queryClient,
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "cabinet_members" },
        (payload) => {
          handleCabinetMemberEvent(
            payload as unknown as Parameters<typeof handleCabinetMemberEvent>[0],
            queryClient,
            user.id,
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);
}
