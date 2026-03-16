import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { invokeFunction } from "@/lib/edgeFunctions";
import { useAuthStore } from "@/stores/authStore";
import { contributionKeys } from "@/lib/queryKeys";
import type { Contribution } from "@/lib/contributions";

export interface PendingContribution extends Contribution {
  user_id: string;
  user_email?: string;
  trust_weight?: number;
  cluster_weight?: number;
  catalog_match?: { id: string; name: string; barcode?: string } | null;
}

export function useIsAdmin() {
  const user = useAuthStore((s) => s.user);
  return (
    !!user &&
    (user as { app_metadata?: { is_admin?: boolean } }).app_metadata
      ?.is_admin === true
  );
}

export function usePendingContributions() {
  const user = useAuthStore((s) => s.user);
  const isAdmin = useIsAdmin();

  return useQuery({
    queryKey: contributionKeys.pending(),
    queryFn: async (): Promise<PendingContribution[]> => {
      const { data, error } = await supabase
        .from("community_contributions")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PendingContribution[];
    },
    enabled: !!user && isAdmin,
  });
}

export function useModerateContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      contributionId,
      action,
    }: {
      contributionId: string;
      action: "approve" | "reject";
    }) =>
      invokeFunction("moderate-contribution", {
        contribution_id: contributionId,
        action,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.pending() });
      queryClient.invalidateQueries({ queryKey: contributionKeys.all() });
    },
  });
}
