import type { AifaRecord } from "../types/aifa.types";

export function normalizeAifaRecord(raw: Record<string, string>): Partial<AifaRecord> {
  return {
    aic_code: raw["CODICE_AIC"]?.trim() || raw["codice_aic"]?.trim(),
    name: raw["DENOMINAZIONE"]?.trim() || raw["denominazione"]?.trim(),
    active_ingredient: raw["PRINCIPIO_ATTIVO"]?.trim() || raw["principio_attivo"]?.trim(),
    manufacturer: raw["TITOLARE_AIC"]?.trim() || raw["titolare_aic"]?.trim(),
    atc_code: raw["CODICE_ATC"]?.trim() || raw["codice_atc"]?.trim(),
    package_description: raw["DESCRIZIONE_CONFEZIONE"]?.trim() || raw["descrizione_confezione"]?.trim() || "",
  };
}
