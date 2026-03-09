import type { QueryClient } from "@tanstack/react-query";
import {
  addUserMedicine,
  updateUserMedicine,
  deleteUserMedicine,
} from "./medicines";
import { mutationTracker } from "./realtime";
import type { MedicineFormData, UserMedicineEditable } from "@/types/medicine";

export const mutationKeys = {
  addMedicine: ["addMedicine"] as const,
  updateMedicine: ["updateMedicine"] as const,
  deleteMedicine: ["deleteMedicine"] as const,
};

export function registerMutationDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(mutationKeys.addMedicine, {
    mutationFn: async (variables: { data: MedicineFormData; id: string }) => {
      mutationTracker.track(variables.id, "INSERT");
      return addUserMedicine(variables.data);
    },
  });

  queryClient.setMutationDefaults(mutationKeys.updateMedicine, {
    mutationFn: async (variables: { id: string; data: UserMedicineEditable }) => {
      mutationTracker.track(variables.id, "UPDATE");
      return updateUserMedicine(variables.id, variables.data);
    },
  });

  queryClient.setMutationDefaults(mutationKeys.deleteMedicine, {
    mutationFn: async (id: string) => {
      mutationTracker.track(id, "DELETE");
      await deleteUserMedicine(id);
    },
  });
}
