import { readFileSync } from "fs";
import { createClient } from "@supabase/supabase-js";
import { parseCsv } from "./parsers/csv-parser";
import { normalizeAifaRecord, isAuthorized } from "./parsers/normalizer";
import { AifaRecordSchema, type ImportResult } from "./types/aifa.types";

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const AIFA_CSV_URL = "https://drive.aifa.gov.it/farmaci/confezioni.csv";
const BATCH_SIZE = 500;

async function fetchCsv(source: string): Promise<string> {
  if (source.startsWith("http")) {
    console.log(`Scaricamento da ${source}...`);
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Download fallito: ${response.status}`);
    return response.text();
  }
  return readFileSync(source, "utf-8");
}

async function importAifa(source: string): Promise<ImportResult> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const content = await fetchCsv(source);
  const rows = parseCsv<Record<string, string>>(content);

  const result: ImportResult = { total: rows.length, imported: 0, skipped: 0, errors: [] };

  const validRecords = [];

  for (let i = 0; i < rows.length; i++) {
    if (!isAuthorized(rows[i])) {
      result.skipped++;
      continue;
    }

    const normalized = normalizeAifaRecord(rows[i]);
    const parsed = AifaRecordSchema.safeParse(normalized);
    if (parsed.success) {
      validRecords.push({ ...parsed.data, source: "aifa" as const, verified: true });
    } else {
      result.errors.push({ row: i + 1, message: parsed.error.message });
      result.skipped++;
    }
  }

  console.log(`Record validi: ${validRecords.length}/${rows.length}`);

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

const source = process.argv[2] || AIFA_CSV_URL;

importAifa(source).then((result) => {
  console.log("Import completato:", result);
});
