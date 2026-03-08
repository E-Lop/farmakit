import { z } from "zod";

export const AifaRecordSchema = z.object({
  aic_code: z.string().min(1),
  name: z.string().min(1),
  active_ingredient: z.string().min(1),
  manufacturer: z.string().min(1),
  atc_code: z.string().min(1),
  package_description: z.string().default(""),
});

export type AifaRecord = z.infer<typeof AifaRecordSchema>;

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}
