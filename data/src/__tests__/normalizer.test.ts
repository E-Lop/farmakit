import { describe, it, expect } from "vitest";
import { normalizeAifaRecord } from "../parsers/normalizer";

describe("normalizeAifaRecord", () => {
  it("normalizza campi uppercase", () => {
    const result = normalizeAifaRecord({
      CODICE_AIC: "012345",
      DENOMINAZIONE: "TACHIPIRINA 500MG",
      PRINCIPIO_ATTIVO: "PARACETAMOLO",
      TITOLARE_AIC: "ANGELINI S.P.A.",
      CODICE_ATC: "N02BE01",
      DESCRIZIONE_CONFEZIONE: "20 compresse",
    });

    expect(result.aic_code).toBe("012345");
    expect(result.name).toBe("TACHIPIRINA 500MG");
    expect(result.active_ingredient).toBe("PARACETAMOLO");
    expect(result.manufacturer).toBe("ANGELINI S.P.A.");
    expect(result.atc_code).toBe("N02BE01");
  });

  it("normalizza campi lowercase", () => {
    const result = normalizeAifaRecord({
      codice_aic: "012345",
      denominazione: "Tachipirina",
      principio_attivo: "Paracetamolo",
      titolare_aic: "Angelini",
      codice_atc: "N02BE01",
    });

    expect(result.aic_code).toBe("012345");
    expect(result.name).toBe("Tachipirina");
  });

  it("gestisce campi mancanti", () => {
    const result = normalizeAifaRecord({});
    expect(result.aic_code).toBeUndefined();
    expect(result.package_description).toBe("");
  });
});
