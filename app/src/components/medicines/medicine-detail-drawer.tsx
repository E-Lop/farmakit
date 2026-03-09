import { useState } from "react";
import { Pencil, Trash2, Pill, FlaskConical, Package, ScanBarcode, FileText, Hourglass } from "lucide-react";
import { format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserMedicine, UserMedicineEditable } from "@/types/medicine";
import { isCountableForm } from "@/lib/pharmaceutical-forms";

type Mode = "view" | "edit" | "delete-confirm";

interface MedicineDetailDrawerProps {
  medicine: UserMedicine | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (id: string, updates: UserMedicineEditable) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function MedicineDetailDrawer({
  medicine,
  open,
  onOpenChange,
  onUpdate,
  onDelete,
}: MedicineDetailDrawerProps) {
  const [mode, setMode] = useState<Mode>("view");
  const [submitting, setSubmitting] = useState(false);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setMode("view");
    onOpenChange(nextOpen);
  };

  if (!medicine) return null;

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        {mode === "view" && (
          <ViewMode
            medicine={medicine}
            onEdit={() => setMode("edit")}
            onDelete={() => setMode("delete-confirm")}
          />
        )}
        {mode === "edit" && (
          <EditMode
            medicine={medicine}
            submitting={submitting}
            onSave={async (updates) => {
              setSubmitting(true);
              try {
                await onUpdate(medicine.id, updates);
                handleOpenChange(false);
              } finally {
                setSubmitting(false);
              }
            }}
            onCancel={() => setMode("view")}
          />
        )}
        {mode === "delete-confirm" && (
          <DeleteMode
            medicine={medicine}
            submitting={submitting}
            onConfirm={async () => {
              setSubmitting(true);
              try {
                await onDelete(medicine.id);
                handleOpenChange(false);
              } finally {
                setSubmitting(false);
              }
            }}
            onCancel={() => setMode("view")}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}

function ViewMode({
  medicine,
  onEdit,
  onDelete,
}: {
  medicine: UserMedicine;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const displayName =
    medicine.medicine?.name ?? medicine.custom_name ?? "Farmaco senza nome";

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>{displayName}</DrawerTitle>
        {medicine.medicine?.active_ingredient && (
          <DrawerDescription>
            {medicine.medicine.active_ingredient}
          </DrawerDescription>
        )}
      </DrawerHeader>

      <div className="flex flex-col gap-3 px-4 py-4">
        {medicine.pharmaceutical_form && (
          <DetailRow icon={<Pill className="h-4 w-4" />} label="Forma" value={medicine.pharmaceutical_form} />
        )}
        {medicine.strength && (
          <DetailRow icon={<FlaskConical className="h-4 w-4" />} label="Dosaggio" value={medicine.strength} />
        )}
        {isCountableForm(medicine.pharmaceutical_form) && (
          <DetailRow
            icon={<Package className="h-4 w-4" />}
            label="Quantità"
            value={String(medicine.quantity)}
          />
        )}
        {medicine.expiry_date && (
          <DetailRow
            icon={<Hourglass className="h-4 w-4" />}
            label="Scadenza"
            value={format(parseISO(medicine.expiry_date), "dd MMMM yyyy", { locale: it })}
          />
        )}
        {medicine.barcode && (
          <DetailRow icon={<ScanBarcode className="h-4 w-4" />} label="Barcode" value={medicine.barcode} />
        )}
        {medicine.notes && (
          <DetailRow icon={<FileText className="h-4 w-4" />} label="Note" value={medicine.notes} />
        )}
      </div>

      <DrawerFooter>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            Modifica
          </Button>
          <Button variant="destructive" className="flex-1 gap-2" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Elimina
          </Button>
        </div>
      </DrawerFooter>
    </>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent text-muted-foreground">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function EditMode({
  medicine,
  submitting,
  onSave,
  onCancel,
}: {
  medicine: UserMedicine;
  submitting: boolean;
  onSave: (updates: UserMedicineEditable) => Promise<void>;
  onCancel: () => void;
}) {
  const displayName =
    medicine.medicine?.name ?? medicine.custom_name ?? "";
  const [customName, setCustomName] = useState(displayName);
  const [quantity, setQuantity] = useState(String(medicine.quantity));
  const [expiryDate, setExpiryDate] = useState(medicine.expiry_date ?? "");
  const [notes, setNotes] = useState(medicine.notes ?? "");
  const [pharmaceuticalForm, setPharmaceuticalForm] = useState(medicine.pharmaceutical_form ?? "");
  const [strength, setStrength] = useState(medicine.strength ?? "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates: UserMedicineEditable = {
      quantity: parseInt(quantity, 10) || 0,
      notes: notes || null,
      pharmaceutical_form: pharmaceuticalForm || null,
      strength: strength || null,
      expiry_date: expiryDate || null,
      ...(!medicine.medicine_id && { custom_name: customName || null }),
    };
    onSave(updates);
  };

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Modifica farmaco</DrawerTitle>
      </DrawerHeader>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 py-2 overflow-y-auto">
        {!medicine.medicine_id && (
          <div className="space-y-1.5">
            <Label htmlFor="edit-name">Nome</Label>
            <Input id="edit-name" value={customName} onChange={(e) => setCustomName(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="edit-form">Forma farmaceutica</Label>
          <Input id="edit-form" value={pharmaceuticalForm} onChange={(e) => setPharmaceuticalForm(e.target.value)} placeholder="Es. Compressa, Sciroppo..." />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-strength">Dosaggio</Label>
          <Input id="edit-strength" value={strength} onChange={(e) => setStrength(e.target.value)} placeholder="Es. 500mg, 200mg/5ml..." />
        </div>
        {isCountableForm(pharmaceuticalForm || null) && (
          <div className="space-y-1.5">
            <Label htmlFor="edit-qty">Quantità</Label>
            <Input id="edit-qty" type="number" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="edit-expiry">Data scadenza</Label>
          <Input id="edit-expiry" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="edit-notes">Note</Label>
          <Input id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note opzionali..." />
        </div>

        <DrawerFooter className="px-0">
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
              Annulla
            </Button>
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? "Salvataggio..." : "Salva"}
            </Button>
          </div>
        </DrawerFooter>
      </form>
    </>
  );
}

function DeleteMode({
  medicine,
  submitting,
  onConfirm,
  onCancel,
}: {
  medicine: UserMedicine;
  submitting: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}) {
  const displayName =
    medicine.medicine?.name ?? medicine.custom_name ?? "questo farmaco";

  return (
    <>
      <DrawerHeader>
        <DrawerTitle>Elimina farmaco</DrawerTitle>
        <DrawerDescription>
          Sei sicuro di voler eliminare <strong>{displayName}</strong>? Questa azione non è reversibile.
        </DrawerDescription>
      </DrawerHeader>

      <DrawerFooter>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onCancel}>
            Annulla
          </Button>
          <Button variant="destructive" className="flex-1" onClick={onConfirm} disabled={submitting}>
            {submitting ? "Eliminazione..." : "Elimina"}
          </Button>
        </div>
      </DrawerFooter>
    </>
  );
}
