import { readFileSync } from "fs";
import { parseCsv } from "./parsers/csv-parser";
import { normalizeAifaRecord } from "./parsers/normalizer";
import { AifaRecordSchema } from "./types/aifa.types";

const filePath = process.argv[2];
if (!filePath) {
  console.error("Utilizzo: npm run validate -- <percorso-file-csv>");
  process.exit(1);
}

const content = readFileSync(filePath, "utf-8");
const rows = parseCsv<Record<string, string>>(content);

let valid = 0;
let invalid = 0;

for (let i = 0; i < rows.length; i++) {
  const normalized = normalizeAifaRecord(rows[i]);
  const result = AifaRecordSchema.safeParse(normalized);
  if (result.success) {
    valid++;
  } else {
    invalid++;
    if (invalid <= 10) {
      console.error(`Riga ${i + 1}:`, result.error.flatten().fieldErrors);
    }
  }
}

console.log(`\nRisultato: ${valid} validi, ${invalid} non validi su ${rows.length} totali`);
