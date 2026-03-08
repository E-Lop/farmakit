import { z } from "zod";

export const AifaRecordSchema = z.object({
  aic_code: z.string().min(1),
  name: z.string().min(1),
  active_ingredient: z.string().default(""),
  manufacturer: z.string().default(""),
  atc_code: z.string().default(""),
  package_description: z.string().default(""),
  pharmaceutical_form: z.string().default(""),
});

export type AifaRecord = z.infer<typeof AifaRecordSchema>;

export interface ImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
}
