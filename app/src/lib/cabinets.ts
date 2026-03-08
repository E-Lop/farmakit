import { supabase } from "./supabase";
import type { Cabinet, CabinetWithRole } from "@/types/cabinet";

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

export async function createCabinet(name: string, icon?: string): Promise<Cabinet> {
  const { data, error } = await supabase
    .from("cabinets")
    .insert({ name, icon })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function inviteMember(cabinetId: string, email: string): Promise<void> {
  const { error } = await supabase.functions.invoke("invite-member", {
    body: { cabinet_id: cabinetId, email },
  });
  if (error) throw error;
}

export async function deleteCabinet(id: string): Promise<void> {
  const { error } = await supabase.from("cabinets").delete().eq("id", id);
  if (error) throw error;
}
