import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUserMedicines, addUserMedicine, updateUserMedicine, deleteUserMedicine } from "@/lib/medicines";
import { medicineKeys } from "@/lib/queryKeys";
import { mutationKeys } from "@/lib/mutationDefaults";
import { mutationTracker } from "@/lib/realtime";
import type { UserMedicine } from "@/types/medicine";

export function useMedicines(cabinetId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = cabinetId ? medicineKeys.list(cabinetId) : medicineKeys.all();

  const query = useQuery({
    queryKey,
    queryFn: () => getUserMedicines(cabinetId!),
    enabled: !!cabinetId,
  });

  const invalidateMedicines = () =>
    queryClient.invalidateQueries({ queryKey });

  const addMutation = useMutation({
    mutationKey: mutationKeys.addMedicine,
    mutationFn: addUserMedicine,
    onSuccess: (data) => {
      mutationTracker.track(data.id, "INSERT");
      invalidateMedicines();
    },
  });

  const updateMutation = useMutation({
    mutationKey: mutationKeys.updateMedicine,
    mutationFn: ({ id, updates }: { id: string; updates: Parameters<typeof updateUserMedicine>[1] }) => {
      mutationTracker.track(id, "UPDATE");
      return updateUserMedicine(id, updates);
    },
    onMutate: async ({ id, updates }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<UserMedicine[]>(queryKey);
      queryClient.setQueryData<UserMedicine[]>(queryKey, (old) =>
        old?.map((m) => (m.id === id ? { ...m, ...updates } : m)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: invalidateMedicines,
  });

  const deleteMutation = useMutation({
    mutationKey: mutationKeys.deleteMedicine,
    mutationFn: (id: string) => {
      mutationTracker.track(id, "DELETE");
      return deleteUserMedicine(id);
    },
    onSuccess: invalidateMedicines,
  });

  return {
    medicines: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addMedicine: addMutation.mutateAsync,
    updateMedicine: updateMutation.mutateAsync,
    deleteMedicine: deleteMutation.mutateAsync,
  };
}
