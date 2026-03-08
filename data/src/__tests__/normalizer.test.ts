import { describe, it, expect } from "vitest";
import { normalizeAifaRecord, isAuthorized } from "../parsers/normalizer";

describe("normalizeAifaRecord", () => {
  it("mappa le colonne del CSV AIFA confezioni.csv", () => {
    const result = normalizeAifaRecord({
      codice_aic: "012345678",
      denominazione: "TACHIPIRINA",
      descrizione: "20 COMPRESSE 500MG",
      ragione_sociale: "ANGELINI S.P.A.",
      codice_atc: "N02BE01",
      pa_associati: "PARACETAMOLO",
      forma: "Compressa",
    });

    expect(result.aic_code).toBe("012345678");
    expect(result.name).toBe("TACHIPIRINA");
    expect(result.active_ingredient).toBe("PARACETAMOLO");
    expect(result.manufacturer).toBe("ANGELINI S.P.A.");
    expect(result.atc_code).toBe("N02BE01");
    expect(result.package_description).toBe("20 COMPRESSE 500MG");
    expect(result.pharmaceutical_form).toBe("Compressa");
  });

  it("gestisce whitespace nei valori", () => {
    const result = normalizeAifaRecord({
      codice_aic: "  012345  ",
      denominazione: " Tachipirina ",
      pa_associati: " Paracetamolo ",
      ragione_sociale: " Angelini ",
      codice_atc: " N02BE01 ",
      descrizione: " 20 compresse ",
    });

    expect(result.aic_code).toBe("012345");
    expect(result.name).toBe("Tachipirina");
    expect(result.active_ingredient).toBe("Paracetamolo");
    expect(result.package_description).toBe("20 compresse");
  });

  it("gestisce campi mancanti", () => {
    const result = normalizeAifaRecord({});
    expect(result.aic_code).toBeUndefined();
    expect(result.name).toBeUndefined();
    expect(result.package_description).toBe("");
    expect(result.pharmaceutical_form).toBe("");
  });
});

describe("isAuthorized", () => {
  it("restituisce true per farmaci autorizzati", () => {
    expect(isAuthorized({ stato_amministrativo: "Autorizzata" })).toBe(true);
  });

  it("restituisce false per farmaci revocati o sospesi", () => {
    expect(isAuthorized({ stato_amministrativo: "Revocata" })).toBe(false);
    expect(isAuthorized({ stato_amministrativo: "Sospesa" })).toBe(false);
  });

  it("restituisce false se il campo manca", () => {
    expect(isAuthorized({})).toBe(false);
  });
});
