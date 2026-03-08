import { useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, Check, X, KeyboardIcon } from "lucide-react";
import { toast } from "sonner";
import { useMedicineLookup } from "@/hooks/useMedicineLookup";
import { useCabinets } from "@/hooks/useCabinets";
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Medicine } from "@/types/medicine";

type ScanState = "scanning" | "manual" | "looking-up" | "found" | "not-found";

export function Scan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cabinetParam = searchParams.get("cabinet");
  const { cabinets } = useCabinets();
  const activeCabinetId = cabinetParam ?? cabinets[0]?.id;

  const { scanLookup } = useMedicineLookup();

  const [state, setState] = useState<ScanState>("scanning");
  const [barcode, setBarcode] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [foundMedicine, setFoundMedicine] = useState<Medicine | null>(null);

  const handleLookup = useCallback(
    async (code: string) => {
      setBarcode(code);
      setState("looking-up");
      try {
        const medicine = await scanLookup(code);
        if (medicine) {
          setFoundMedicine(medicine);
          setState("found");
        } else {
          setState("not-found");
        }
      } catch {
        toast.error("Errore nella ricerca del farmaco");
        setState("not-found");
      }
    },
    [scanLookup],
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) handleLookup(manualCode.trim());
  };

  const navigateToAdd = (params: Record<string, string>) => {
    const query = new URLSearchParams(params);
    if (activeCabinetId) query.set("cabinet", activeCabinetId);
    navigate(`/add?${query.toString()}`);
  };

  const handleUseFound = () => {
    if (!foundMedicine) return;
    navigateToAdd({
      medicineId: foundMedicine.id,
      name: foundMedicine.name,
      barcode,
    });
  };

  const handleAddCustom = () => {
    navigateToAdd({ barcode });
  };

  const handleRescan = () => {
    setBarcode("");
    setFoundMedicine(null);
    setManualCode("");
    setState("scanning");
  };

  return (
    <>
      <Header title="Scansiona" showBack />
      <PageLayout>
        <div className="pt-2 animate-fade-in">
          {state === "scanning" && (
            <BarcodeScanner
              onResult={handleLookup}
              onManualInput={() => setState("manual")}
            />
          )}

          {state === "manual" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 rounded-xl bg-accent p-3">
                <KeyboardIcon className="h-5 w-5 text-primary" strokeWidth={1.5} />
                <p className="text-sm font-medium">Inserisci codice a barre</p>
              </div>
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="barcode">Codice EAN</Label>
                  <Input
                    id="barcode"
                    placeholder="Es. 8012345678901"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    inputMode="numeric"
                    autoFocus
                  />
                </div>
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={handleRescan}
                  >
                    Torna allo scanner
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={!manualCode.trim()}
                  >
                    Cerca
                  </Button>
                </div>
              </form>
            </div>
          )}

          {state === "looking-up" && (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div>
                <p className="text-sm font-medium">Ricerca in corso...</p>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{barcode}</p>
              </div>
            </div>
          )}

          {state === "found" && foundMedicine && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-600 dark:text-green-400" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                    Farmaco trovato
                  </p>
                  <p className="mt-1 text-sm font-medium">{foundMedicine.name}</p>
                  {foundMedicine.active_ingredient && (
                    <p className="text-xs text-muted-foreground">
                      {foundMedicine.active_ingredient}
                    </p>
                  )}
                  {foundMedicine.manufacturer && (
                    <p className="text-xs text-muted-foreground/70">
                      {foundMedicine.manufacturer}
                    </p>
                  )}
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    EAN: {barcode}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleRescan}>
                  Scansiona altro
                </Button>
                <Button className="flex-1" onClick={handleUseFound}>
                  Aggiungi
                </Button>
              </div>
            </div>
          )}

          {state === "not-found" && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/30">
                <X className="mt-0.5 h-5 w-5 shrink-0 text-orange-600 dark:text-orange-400" />
                <div>
                  <p className="text-sm font-semibold text-orange-800 dark:text-orange-200">
                    Farmaco non trovato
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Il codice <span className="font-mono">{barcode}</span> non è presente nel catalogo.
                    Puoi aggiungerlo manualmente.
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={handleRescan}>
                  Scansiona altro
                </Button>
                <Button className="flex-1" onClick={handleAddCustom}>
                  Aggiungi manualmente
                </Button>
              </div>
            </div>
          )}
        </div>
      </PageLayout>
    </>
  );
}
