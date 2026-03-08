import { describe, it, expect } from "vitest";
import { parseCsv } from "../parsers/csv-parser";

describe("parseCsv", () => {
  it("parsa CSV con delimitatore punto e virgola", () => {
    const csv = "nome;cognome\nMario;Rossi\nLuigi;Bianchi";
    const result = parseCsv<{ nome: string; cognome: string }>(csv);

    expect(result).toHaveLength(2);
    expect(result[0].nome).toBe("Mario");
    expect(result[1].cognome).toBe("Bianchi");
  });

  it("gestisce righe vuote", () => {
    const csv = "nome;cognome\n\nMario;Rossi\n\n";
    const result = parseCsv(csv);
    expect(result).toHaveLength(1);
  });
});
