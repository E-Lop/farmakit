export interface Cabinet {
  id: string;
  name: string;
  icon: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CabinetMember {
  id: string;
  cabinet_id: string;
  user_id: string;
  role: "owner" | "editor";
  created_at: string;
}

export interface CabinetWithRole extends Cabinet {
  role: "owner" | "editor";
  member_count: number;
}
