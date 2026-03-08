import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserMedicines, addUserMedicine, deleteUserMedicine } from "@/lib/medicines";

export function useMedicines(cabinetId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-medicines", cabinetId],
    queryFn: () => getUserMedicines(cabinetId!),
    enabled: !!cabinetId,
  });

  const invalidateMedicines = () =>
    queryClient.invalidateQueries({ queryKey: ["user-medicines", cabinetId] });

  const addMutation = useMutation({
    mutationFn: addUserMedicine,
    onSuccess: invalidateMedicines,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUserMedicine,
    onSuccess: invalidateMedicines,
  });

  return {
    medicines: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addMedicine: addMutation.mutateAsync,
    deleteMedicine: deleteMutation.mutateAsync,
  };
}
