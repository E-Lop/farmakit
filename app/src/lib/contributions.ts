import { supabase } from "./supabase";
import { invokeFunction } from "./edgeFunctions";

export type ContributionType = "new_medicine" | "barcode_add" | "correction";

export interface ContributionData {
  name?: string;
  barcode?: string;
  active_ingredient?: string;
  manufacturer?: string;
  medicine_id?: string;
  correction_field?: string;
  correction_value?: string;
}

export interface Contribution {
  id: string;
  contribution_type: ContributionType;
  data: ContributionData;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export async function submitContribution(
  contributionType: ContributionType,
  data: ContributionData,
): Promise<Contribution> {
  const result = await invokeFunction<{ data: Contribution }>(
    "submit-contribution",
    { contribution_type: contributionType, data },
  );
  return result.data;
}

export async function fetchMyContributions(): Promise<Contribution[]> {
  const { data, error } = await supabase
    .from("community_contributions")
    .select("id, contribution_type, data, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return (data ?? []) as Contribution[];
}
