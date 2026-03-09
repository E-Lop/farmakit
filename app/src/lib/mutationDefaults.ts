import type { QueryClient } from "@tanstack/react-query";
import {
  addUserMedicine,
  updateUserMedicine,
  deleteUserMedicine,
} from "./medicines";
import type { MedicineFormData, UserMedicineEditable } from "@/types/medicine";

export const mutationKeys = {
  addMedicine: ["addMedicine"] as const,
  updateMedicine: ["updateMedicine"] as const,
  deleteMedicine: ["deleteMedicine"] as const,
};

export function registerMutationDefaults(queryClient: QueryClient): void {
  queryClient.setMutationDefaults(mutationKeys.addMedicine, {
    mutationFn: async (data: MedicineFormData) => {
      return addUserMedicine(data);
    },
  });

  queryClient.setMutationDefaults(mutationKeys.updateMedicine, {
    mutationFn: async (variables: { id: string; updates: UserMedicineEditable }) => {
      return updateUserMedicine(variables.id, variables.updates);
    },
  });

  queryClient.setMutationDefaults(mutationKeys.deleteMedicine, {
    mutationFn: async (id: string) => {
      await deleteUserMedicine(id);
    },
  });
}
