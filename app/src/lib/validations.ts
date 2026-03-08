import type { MedicineFormData } from "@/types/medicine";

export function validateMedicineForm(data: Partial<MedicineFormData>): string[] {
  const errors: string[] = [];

  if (!data.cabinet_id) {
    errors.push("Seleziona un armadietto");
  }
  if (!data.medicine_id && !data.custom_name?.trim()) {
    errors.push("Inserisci il nome del farmaco o selezionane uno dal catalogo");
  }
  if (data.quantity != null && data.quantity < 0) {
    errors.push("La quantità non può essere negativa");
  }
  if (data.expiry_date) {
    const date = new Date(data.expiry_date);
    if (isNaN(date.getTime())) {
      errors.push("Data di scadenza non valida");
    }
  }

  return errors;
}
