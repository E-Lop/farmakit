import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ContributionMedicineData {
  name?: string;
  barcode?: string;
  active_ingredient?: string;
  manufacturer?: string;
}

// Crea o aggiorna un record nel catalogo medicines da una contribuzione approvata
export async function applyToMedicines(
  supabase: ReturnType<typeof createClient>,
  data: ContributionMedicineData,
): Promise<void> {
  if (!data.name) return;

  const medicineData: Record<string, unknown> = {
    name: data.name,
    source: "community",
    verified: false,
  };

  if (data.barcode) medicineData.barcode = data.barcode;
  if (data.active_ingredient)
    medicineData.active_ingredient = data.active_ingredient;
  if (data.manufacturer) medicineData.manufacturer = data.manufacturer;

  // Se c'è un barcode, cerca se esiste già
  if (data.barcode) {
    const { data: existing } = await supabase
      .from("medicines")
      .select("id")
      .eq("barcode", data.barcode)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("medicines")
        .update(medicineData)
        .eq("id", existing.id);
      return;
    }
  }

  await supabase.from("medicines").insert(medicineData);
}
