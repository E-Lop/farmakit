import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserMedicines, addUserMedicine, deleteUserMedicine } from "@/lib/medicines";
import type { MedicineFormData } from "@/types/medicine";

export function useMedicines(cabinetId: string | null) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["user-medicines", cabinetId],
    queryFn: () => getUserMedicines(cabinetId!),
    enabled: !!cabinetId,
  });

  const addMutation = useMutation({
    mutationFn: (data: MedicineFormData) => addUserMedicine(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-medicines", cabinetId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUserMedicine(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-medicines", cabinetId] });
    },
  });

  return {
    medicines: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addMedicine: addMutation.mutateAsync,
    deleteMedicine: deleteMutation.mutateAsync,
  };
}
