import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useCabinets } from "@/hooks/useCabinets";
import { useMedicines } from "@/hooks/useMedicines";
import { MedicineSearch } from "@/components/medicines/MedicineSearch";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Medicine } from "@/types/medicine";

// Forme farmaceutiche più comuni per uso domestico (coerenti con catalogo AIFA)
const COMMON_FORMS = [
  "Compressa",
  "Compressa rivestita con film",
  "Compressa effervescente",
  "Compressa orodispersibile",
  "Compressa masticabile",
  "Compressa a rilascio prolungato",
  "Capsula rigida",
  "Capsula molle",
  "Capsula rigida gastroresistente",
  "Bustina",
  "Granulato",
  "Granulato effervescente",
  "Sciroppo",
  "Soluzione orale",
  "Gocce orali, soluzione",
  "Sospensione orale",
  "Supposta",
  "Crema",
  "Gel",
  "Pomata",
  "Cerotto transdermico",
  "Spray",
  "Spray nasale",
  "Collirio, soluzione",
  "Pastiglia",
  "Soluzione iniettabile",
];

export function AddMedicine() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cabinetParam = searchParams.get("cabinet");
  const prefillMedicineId = searchParams.get("medicineId");
  const prefillName = searchParams.get("name") ?? "";
  const prefillBarcode = searchParams.get("barcode") ?? "";

  const { cabinets, isLoading: cabinetsLoading } = useCabinets();

  const [selectedCabinetId, setSelectedCabinetId] = useState(cabinetParam ?? "");

  // Se il param non corrisponde a nessun armadietto, usa il primo disponibile
  const activeCabinetId =
    cabinets.find((c) => c.id === selectedCabinetId)?.id ??
    cabinets[0]?.id ??
    null;

  // Sincronizza quando i cabinets arrivano e non c'era un param valido
  if (activeCabinetId && !selectedCabinetId && cabinets.length > 0) {
    setSelectedCabinetId(activeCabinetId);
  }

  const { addMedicine } = useMedicines(activeCabinetId);

  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [customName, setCustomName] = useState(prefillMedicineId ? "" : prefillName);
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState("");
  const [strength, setStrength] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [barcode, setBarcode] = useState(prefillBarcode);
  const [submitting, setSubmitting] = useState(false);

  const prefilledFromScan = !!prefillMedicineId;

  const displayName = selectedMedicine?.name ?? customName;

  const handleSelectMedicine = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setCustomName("");
    if (medicine.barcode && !barcode) setBarcode(medicine.barcode);
  };

  const handleCustomName = (name: string) => {
    setSelectedMedicine(null);
    setCustomName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCabinetId) return;
    if (!selectedMedicine && !customName.trim() && !prefillMedicineId) return;

    setSubmitting(true);
    try {
      await addMedicine({
        cabinet_id: activeCabinetId,
        medicine_id: selectedMedicine?.id ?? prefillMedicineId ?? undefined,
        custom_name: selectedMedicine || prefillMedicineId ? undefined : customName.trim(),
        pharmaceutical_form: pharmaceuticalForm || undefined,
        strength: strength.trim() || undefined,
        quantity: parseInt(quantity, 10) || 1,
        expiry_date: expiryDate || undefined,
        notes: notes.trim() || undefined,
        barcode: barcode || undefined,
        notify_before_days: 30,
      });
      toast.success("Farmaco aggiunto");
      navigate(-1);
    } catch {
      toast.error("Errore nell'aggiunta del farmaco");
    } finally {
      setSubmitting(false);
    }
  };

  if (cabinetsLoading) {
    return (
      <>
        <Header title="Aggiungi farmaco" showBack />
        <PageLayout>
          <div className="flex flex-col gap-3 pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        </PageLayout>
      </>
    );
  }

  if (cabinets.length === 0) {
    return (
      <>
        <Header title="Aggiungi farmaco" showBack />
        <PageLayout>
          <p className="pt-8 text-center text-sm text-muted-foreground">
            Crea prima un armadietto.
          </p>
        </PageLayout>
      </>
    );
  }

  const canSubmit =
    !!activeCabinetId &&
    (!!selectedMedicine || !!customName.trim() || !!prefillMedicineId);

  return (
    <>
      <Header title="Aggiungi farmaco" showBack />
      <PageLayout>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2 animate-fade-in">
          {/* Selettore armadietto */}
          <div className="space-y-2">
            <Label htmlFor="cabinet">Armadietto</Label>
            {cabinets.length === 1 ? (
              <div className="flex h-9 items-center rounded-md border border-input bg-muted/50 px-3 text-sm">
                {cabinets[0].icon && <span className="mr-2">{cabinets[0].icon}</span>}
                {cabinets[0].name}
              </div>
            ) : (
              <Select
                value={activeCabinetId ?? ""}
                onValueChange={setSelectedCabinetId}
              >
                <SelectTrigger id="cabinet">
                  <SelectValue placeholder="Seleziona armadietto" />
                </SelectTrigger>
                <SelectContent>
                  {cabinets.map((cab) => (
                    <SelectItem key={cab.id} value={cab.id}>
                      {cab.icon ? `${cab.icon} ` : ""}{cab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {prefilledFromScan && prefillName ? (
            <div className="space-y-2">
              <Label>Farmaco dal catalogo</Label>
              <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 dark:border-green-900 dark:bg-green-950/30">
                <p className="text-sm font-medium">{prefillName}</p>
                {prefillBarcode && (
                  <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                    EAN: {prefillBarcode}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Cerca nel catalogo o inserisci nome</Label>
              <MedicineSearch
                onSelect={handleSelectMedicine}
                onCustomName={handleCustomName}
                initialQuery={prefillName}
              />
              {selectedMedicine && (
                <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm dark:border-green-900 dark:bg-green-950/30">
                  <span className="font-medium">{selectedMedicine.name}</span>
                  {selectedMedicine.active_ingredient && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({selectedMedicine.active_ingredient})
                    </span>
                  )}
                </div>
              )}
              {!selectedMedicine && customName && (
                <p className="text-xs text-muted-foreground">
                  Nome personalizzato: <span className="font-medium">{customName}</span>
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="form">Forma farmaceutica</Label>
              <Input
                id="form"
                list="form-suggestions"
                placeholder="Es. Compressa"
                value={pharmaceuticalForm}
                onChange={(e) => setPharmaceuticalForm(e.target.value)}
              />
              <datalist id="form-suggestions">
                {COMMON_FORMS.map((form) => (
                  <option key={form} value={form} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label htmlFor="strength">Dosaggio</Label>
              <Input
                id="strength"
                placeholder="Es. 600 mg"
                value={strength}
                onChange={(e) => setStrength(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantità</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry">Scadenza</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note (opzionale)</Label>
            <Input
              id="notes"
              placeholder="Es. Dopo i pasti"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || !canSubmit}
          >
            {submitting ? "Salvataggio..." : `Aggiungi ${displayName || "farmaco"}`}
          </Button>
        </form>
      </PageLayout>
    </>
  );
}
