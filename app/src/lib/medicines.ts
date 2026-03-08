import { supabase } from "./supabase";
import type { Medicine, UserMedicine, MedicineFormData } from "@/types/medicine";

export async function searchMedicines(query: string): Promise<Medicine[]> {
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .or(`name.ilike.%${query}%,active_ingredient.ilike.%${query}%,barcode.eq.${query}`)
    .limit(20);

  if (error) throw error;
  return data ?? [];
}

export async function lookupByBarcode(barcode: string): Promise<Medicine | null> {
  const { data, error } = await supabase
    .from("medicines")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function getUserMedicines(cabinetId: string): Promise<UserMedicine[]> {
  const { data, error } = await supabase
    .from("user_medicines")
    .select("*, medicine:medicines(*)")
    .eq("cabinet_id", cabinetId)
    .order("expiry_date", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function addUserMedicine(form: MedicineFormData): Promise<UserMedicine> {
  const { data, error } = await supabase
    .from("user_medicines")
    .insert(form)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteUserMedicine(id: string): Promise<void> {
  const { error } = await supabase.from("user_medicines").delete().eq("id", id);
  if (error) throw error;
}
