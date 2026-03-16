import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { contributionKeys } from "@/lib/queryKeys";
import {
  submitContribution,
  fetchMyContributions,
  type ContributionType,
  type ContributionData,
} from "@/lib/contributions";
import { useAuthStore } from "@/stores/authStore";

export function useMyContributions() {
  const user = useAuthStore((s) => s.user);

  return useQuery({
    queryKey: contributionKeys.all(),
    queryFn: fetchMyContributions,
    enabled: !!user,
  });
}

export function useSubmitContribution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      data,
    }: {
      type: ContributionType;
      data: ContributionData;
    }) => submitContribution(type, data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: contributionKeys.all() });
      if (result.status === "approved") {
        toast.success("Contribuzione approvata automaticamente! Grazie.");
      } else {
        toast.success("Contribuzione inviata. Sarà revisionata a breve.");
      }
    },
    onError: () => {
      toast.error("Errore nell'invio della contribuzione");
    },
  });
}
