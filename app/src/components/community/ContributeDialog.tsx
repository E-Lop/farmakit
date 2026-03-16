import { useState } from "react";
import { useSubmitContribution } from "@/hooks/useContributions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart } from "lucide-react";
import type { ContributionType, ContributionData } from "@/lib/contributions";

interface ContributeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  barcode?: string;
  type?: ContributionType;
}

export function ContributeDialog({
  open,
  onOpenChange,
  barcode,
  type = "new_medicine",
}: ContributeDialogProps) {
  const [name, setName] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const submit = useSubmitContribution();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const data: ContributionData = {
      name: name.trim(),
      barcode: barcode || undefined,
      active_ingredient: activeIngredient.trim() || undefined,
      manufacturer: manufacturer.trim() || undefined,
    };

    submit.mutate(
      { type, data },
      {
        onSuccess: () => {
          onOpenChange(false);
          setName("");
          setActiveIngredient("");
          setManufacturer("");
        },
      },
    );
  }

  const title =
    type === "barcode_add"
      ? "Aggiungi barcode a farmaco"
      : type === "correction"
        ? "Segnala correzione"
        : "Segnala nuovo farmaco";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Aiuta la community aggiungendo farmaci mancanti dal catalogo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {barcode && (
            <div className="rounded-lg bg-accent px-3 py-2 text-sm">
              Barcode: <span className="font-mono font-medium">{barcode}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="medicine-name">
              Nome farmaco <span className="text-destructive">*</span>
            </Label>
            <Input
              id="medicine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="es. Tachipirina 1000mg"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="active-ingredient">Principio attivo</Label>
            <Input
              id="active-ingredient"
              value={activeIngredient}
              onChange={(e) => setActiveIngredient(e.target.value)}
              placeholder="es. Paracetamolo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manufacturer">Produttore</Label>
            <Input
              id="manufacturer"
              value={manufacturer}
              onChange={(e) => setManufacturer(e.target.value)}
              placeholder="es. Angelini"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={!name.trim() || submit.isPending}
          >
            {submit.isPending ? "Invio..." : "Invia contribuzione"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
