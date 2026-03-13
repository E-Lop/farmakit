import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createInvite, acceptInvite } from "@/lib/invites";
import {
  getCabinetMembers,
  leaveCabinet,
  removeCabinetMember,
} from "@/lib/cabinets";
import { cabinetKeys } from "@/lib/queryKeys";
import { useAuth } from "@/hooks/useAuth";

export function useCabinetMembers(cabinetId: string | undefined) {
  return useQuery({
    queryKey: cabinetKeys.members(cabinetId ?? ""),
    queryFn: () => getCabinetMembers(cabinetId!),
    enabled: !!cabinetId,
  });
}

export function useCreateInvite() {
  return useMutation({
    mutationFn: createInvite,
  });
}

export function useAcceptInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.all() });
    },
  });
}

export function useLeaveCabinet() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: (cabinetId: string) => {
      if (!user) throw new Error("Non autenticato");
      return leaveCabinet(cabinetId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: cabinetKeys.all() });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      cabinetId,
      userId,
    }: {
      cabinetId: string;
      userId: string;
    }) => removeCabinetMember(cabinetId, userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: cabinetKeys.members(variables.cabinetId),
      });
      queryClient.invalidateQueries({ queryKey: cabinetKeys.all() });
    },
  });
}
