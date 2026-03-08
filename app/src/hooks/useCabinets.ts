import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getCabinets, createCabinet, deleteCabinet } from "@/lib/cabinets";

export function useCabinets() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["cabinets"],
    queryFn: getCabinets,
  });

  const createMutation = useMutation({
    mutationFn: ({ name, icon }: { name: string; icon?: string }) =>
      createCabinet(name, icon),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCabinet(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cabinets"] });
    },
  });

  return {
    cabinets: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    createCabinet: createMutation.mutateAsync,
    deleteCabinet: deleteMutation.mutateAsync,
  };
}
