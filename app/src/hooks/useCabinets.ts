import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getCabinets,
  createCabinet,
  updateCabinet,
  deleteCabinet,
} from "@/lib/cabinets";

export function useCabinets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cabinets"],
    queryFn: getCabinets,
  });

  const invalidateCabinets = () =>
    queryClient.invalidateQueries({ queryKey: ["cabinets"] });

  const createMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon?: string }) =>
      createCabinet(name, icon),
    onSuccess: invalidateCabinets,
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { name?: string; icon?: string };
    }) => updateCabinet(id, updates),
    onSuccess: invalidateCabinets,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCabinet,
    onSuccess: invalidateCabinets,
  });

  return {
    cabinets: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createCabinet: createMutation.mutateAsync,
    updateCabinet: updateMutation.mutateAsync,
    deleteCabinet: deleteMutation.mutateAsync,
  };
}
