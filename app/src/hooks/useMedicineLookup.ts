import { useState, useCallback } from "react";
import { searchMedicines, lookupByBarcode } from "@/lib/medicines";
import type { Medicine } from "@/types/medicine";

export function useMedicineLookup() {
  const [results, setResults] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const data = await searchMedicines(query);
      setResults(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const scanLookup = useCallback(async (barcode: string) => {
    setLoading(true);
    try {
      const medicine = await lookupByBarcode(barcode);
      setResults(medicine ? [medicine] : []);
      return medicine;
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, search, scanLookup };
}
