export interface Medicine {
  id: string;
  aic_code: string | null;
  name: string;
  active_ingredient: string | null;
  manufacturer: string | null;
  atc_code: string | null;
  package_description: string | null;
  barcode: string | null;
  source: "aifa" | "community";
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserMedicine {
  id: string;
  cabinet_id: string;
  medicine_id: string | null;
  custom_name: string | null;
  quantity: number;
  expiry_date: string | null;
  notes: string | null;
  barcode: string | null;
  notify_before_days: number;
  created_at: string;
  updated_at: string;
  medicine?: Medicine;
}

export interface MedicineFormData {
  medicine_id?: string;
  custom_name?: string;
  cabinet_id: string;
  quantity: number;
  expiry_date?: string;
  notes?: string;
  barcode?: string;
  notify_before_days: number;
}
