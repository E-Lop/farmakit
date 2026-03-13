import { supabase } from "./supabase";
import type { Cabinet, CabinetMember, CabinetWithRole } from "@/types/cabinet";

export async function getCabinets(): Promise<CabinetWithRole[]> {
  const { data, error } = await supabase
    .from("cabinet_members")
    .select("role, cabinet:cabinets(*, cabinet_members(count))")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => {
    const cabinet = row.cabinet as unknown as Cabinet & {
      cabinet_members: [{ count: number }];
    };
    return {
      ...cabinet,
      role: row.role as "owner" | "editor",
      member_count: cabinet.cabinet_members[0].count,
    };
  });
}

export async function updateCabinet(
  id: string,
  updates: { name?: string; icon?: string },
): Promise<Cabinet> {
  const { data, error } = await supabase
    .from("cabinets")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function createCabinet(name: string, icon?: string): Promise<Cabinet> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non autenticato");

  const { data, error } = await supabase
    .from("cabinets")
    .insert({ name, icon, owner_id: user.id })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCabinet(id: string): Promise<void> {
  const { error } = await supabase.from("cabinets").delete().eq("id", id);
  if (error) throw error;
}

export async function getCabinetMembers(
  cabinetId: string,
): Promise<CabinetMember[]> {
  const { data, error } = await supabase
    .from("cabinet_members")
    .select("id, cabinet_id, user_id, role, created_at")
    .eq("cabinet_id", cabinetId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function removeCabinetMember(
  cabinetId: string,
  userId: string,
): Promise<void> {
  const { error } = await supabase
    .from("cabinet_members")
    .delete()
    .eq("cabinet_id", cabinetId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function leaveCabinet(
  cabinetId: string,
  userId: string,
): Promise<void> {
  await removeCabinetMember(cabinetId, userId);
}
