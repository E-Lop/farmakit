import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useMedicines } from "@/hooks/useMedicines";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddMedicine() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cabinetId = searchParams.get("cabinet");

  const { addMedicine } = useMedicines(cabinetId);

  const [customName, setCustomName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cabinetId || !customName.trim()) return;

    setSubmitting(true);
    try {
      await addMedicine({
        cabinet_id: cabinetId,
        custom_name: customName.trim(),
        quantity: parseInt(quantity, 10) || 1,
        expiry_date: expiryDate || undefined,
        notes: notes.trim() || undefined,
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

  if (!cabinetId) {
    return (
      <>
        <Header title="Aggiungi farmaco" showBack />
        <PageLayout>
          <p className="pt-8 text-center text-sm text-muted-foreground">
            Seleziona prima un armadietto.
          </p>
        </PageLayout>
      </>
    );
  }

  return (
    <>
      <Header title="Aggiungi farmaco" showBack />
      <PageLayout>
        <form onSubmit={handleSubmit} className="space-y-5 pt-2 animate-fade-in">
          <div className="space-y-2">
            <Label htmlFor="name">Nome farmaco</Label>
            <Input
              id="name"
              placeholder="Es. Tachipirina 1000mg"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
              autoFocus
            />
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
            disabled={submitting || !customName.trim()}
          >
            {submitting ? "Salvataggio..." : "Aggiungi farmaco"}
          </Button>
        </form>
      </PageLayout>
    </>
  );
}
