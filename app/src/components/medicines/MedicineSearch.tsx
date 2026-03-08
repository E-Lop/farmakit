import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Pill } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useMedicineLookup } from "@/hooks/useMedicineLookup";
import type { Medicine } from "@/types/medicine";

interface MedicineSearchProps {
  onSelect: (medicine: Medicine) => void;
  onCustomName: (name: string) => void;
  initialQuery?: string;
}

export function MedicineSearch({ onSelect, onCustomName, initialQuery = "" }: MedicineSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [showResults, setShowResults] = useState(false);
  const { results, loading, search } = useMedicineLookup();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (initialQuery) {
      search(initialQuery);
      setShowResults(true);
    }
  }, [initialQuery, search]);

  const handleChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    if (value.length >= 2) {
      debounceRef.current = setTimeout(() => {
        search(value);
        setShowResults(true);
      }, 300);
    } else {
      setShowResults(false);
    }
  };

  const handleSelect = (medicine: Medicine) => {
    setQuery(medicine.name);
    setShowResults(false);
    onSelect(medicine);
  };

  const handleUseCustom = () => {
    setShowResults(false);
    onCustomName(query);
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Cerca farmaco per nome o principio attivo..."
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {showResults && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-xl border border-border bg-card shadow-lg">
          {results.length > 0 ? (
            results.map((med) => (
              <button
                key={med.id}
                type="button"
                className="flex w-full items-start gap-3 border-b border-border/50 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-accent"
                onClick={() => handleSelect(med)}
              >
                <Pill className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={1.5} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{med.name}</p>
                  {med.active_ingredient && (
                    <p className="truncate text-xs text-muted-foreground">
                      {med.active_ingredient}
                    </p>
                  )}
                  {med.manufacturer && (
                    <p className="truncate text-xs text-muted-foreground/70">
                      {med.manufacturer}
                    </p>
                  )}
                </div>
              </button>
            ))
          ) : !loading ? (
            <div className="px-3 py-4 text-center text-sm text-muted-foreground">
              Nessun risultato nel catalogo
            </div>
          ) : null}

          {query.trim() && (
            <button
              type="button"
              className="flex w-full items-center gap-2 border-t border-border bg-muted/30 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted"
              onClick={handleUseCustom}
            >
              <span className="text-muted-foreground">Usa nome personalizzato:</span>
              <span className="font-medium">{query}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
