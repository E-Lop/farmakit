/**
 * Forme farmaceutiche non contabili (liquidi, topici, spray).
 * Per queste forme il conteggio unitario non ha senso pratico,
 * quindi lo stepper quantità e gli alert scorta bassa vengono nascosti.
 */
const NON_COUNTABLE_KEYWORDS = [
  "sciroppo",
  "soluzione orale",
  "gocce orali",
  "sospensione orale",
  "soluzione iniettabile",
  "crema",
  "gel",
  "pomata",
  "spray",
  "spray nasale",
  "collirio",
] as const;

export function isCountableForm(form: string | null | undefined): boolean {
  if (!form) return true;
  const lower = form.toLowerCase();
  return !NON_COUNTABLE_KEYWORDS.some((keyword) => lower.includes(keyword));
}
