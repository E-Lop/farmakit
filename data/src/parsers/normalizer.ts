import type { AifaRecord } from "../types/aifa.types";

/**
 * Colonne CSV reale AIFA (confezioni.csv):
 * codice_aic;cod_farmaco;cod_confezione;denominazione;descrizione;
 * codice_ditta;ragione_sociale;stato_amministrativo;tipo_procedura;
 * forma;codice_atc;pa_associati;link
 */
export function normalizeAifaRecord(raw: Record<string, string>): Partial<AifaRecord> {
  return {
    aic_code: raw["codice_aic"]?.trim(),
    name: raw["denominazione"]?.trim(),
    active_ingredient: raw["pa_associati"]?.trim(),
    manufacturer: raw["ragione_sociale"]?.trim(),
    atc_code: raw["codice_atc"]?.trim(),
    package_description: raw["descrizione"]?.trim() || "",
    pharmaceutical_form: raw["forma"]?.trim() || "",
  };
}

/** Filtra solo i farmaci con stato "Autorizzata" */
export function isAuthorized(raw: Record<string, string>): boolean {
  return raw["stato_amministrativo"]?.trim() === "Autorizzata";
}
