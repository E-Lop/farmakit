import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseCsv } from "./parsers/csv-parser";
import { normalizeAifaRecord } from "./parsers/normalizer";
import { AifaRecordSchema, type ImportResult } from "./types/aifa.types";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function importAifa(filePath: string): Promise<ImportResult> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const content = readFileSync(filePath, "utf-8");
  const rows = parseCsv<Record<string, string>>(content);

  const result: ImportResult = { total: rows.length, imported: 0, skipped: 0, errors: [] };

  const BATCH_SIZE = 500;
  const validRecords = [];

  for (let i = 0; i < rows.length; i++) {
    const normalized = normalizeAifaRecord(rows[i]);
    const parsed = AifaRecordSchema.safeParse(normalized);
    if (parsed.success) {
      validRecords.push({ ...parsed.data, source: "aifa" as const, verified: true });
    } else {
      result.errors.push({ row: i + 1, message: parsed.error.message });
      result.skipped++;
    }
  }

  for (let i = 0; i < validRecords.length; i += BATCH_SIZE) {
    const batch = validRecords.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("medicines")
      .upsert(batch, { onConflict: "aic_code" });

    if (error) {
      result.errors.push({ row: i, message: error.message });
    } else {
      result.imported += batch.length;
    }
  }

  return result;
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Utilizzo: npm run import:aifa -- <percorso-file-csv>");
  process.exit(1);
}

importAifa(filePath).then((result) => {
  console.log("Import completato:", result);
});
