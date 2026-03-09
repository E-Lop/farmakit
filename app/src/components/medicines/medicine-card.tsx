import { Minus, Plus, Hourglass } from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { isCountableForm } from "@/lib/pharmaceutical-forms";
import type { UserMedicine } from "@/types/medicine";

function getExpiryStatus(expiryDate: string | null) {
  if (!expiryDate) return null;
  const days = differenceInDays(parseISO(expiryDate), new Date());
  if (days < 0) return { label: "Scaduto", variant: "destructive" as const };
  if (days <= 30)
    return { label: `Scade tra ${days}g`, variant: "destructive" as const };
  if (days <= 90)
    return { label: `Scade tra ${days}g`, variant: "outline" as const };
  return null;
}

interface MedicineCardProps {
  medicine: UserMedicine;
  index: number;
  onTap: () => void;
  onQuantityChange: (newQuantity: number) => void;
}

export function MedicineCard({
  medicine,
  index,
  onTap,
  onQuantityChange,
}: MedicineCardProps) {
  const displayName =
    medicine.medicine?.name ?? medicine.custom_name ?? "Farmaco senza nome";
  const expiry = getExpiryStatus(medicine.expiry_date);
  const isExpiring = expiry?.variant === "destructive";
  const countable = isCountableForm(medicine.pharmaceutical_form);

  const subtitleParts = [
    medicine.pharmaceutical_form,
    medicine.strength,
  ].filter(Boolean);

  return (
    <button
      type="button"
      onClick={onTap}
      className={cn(
        "rounded-xl border bg-card p-3 shadow-sm animate-slide-up text-left w-full transition-shadow active:shadow-md",
        isExpiring ? "border-destructive/50" : "border-border",
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Riga 1: nome + stepper */}
      <div className="flex items-center gap-3">
        <p className="flex-1 min-w-0 truncate text-sm font-medium text-card-foreground">
          {displayName}
        </p>

        {countable && (
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              disabled={medicine.quantity <= 0}
              onClick={() => onQuantityChange(medicine.quantity - 1)}
              aria-label="Diminuisci quantità"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-7 text-center text-sm font-semibold tabular-nums">
              {medicine.quantity}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => onQuantityChange(medicine.quantity + 1)}
              aria-label="Aumenta quantità"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Riga 2: data, forma/dosaggio, badge scadenza */}
      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
        {medicine.expiry_date && (
          <span className="flex items-center gap-1 shrink-0">
            <Hourglass className="h-3 w-3" />
            {format(parseISO(medicine.expiry_date), "dd MMM yyyy", {
              locale: it,
            })}
          </span>
        )}
        {subtitleParts.length > 0 && (
          <>
            {medicine.expiry_date && <span className="text-border">·</span>}
            <span className="truncate">{subtitleParts.join(" ")}</span>
          </>
        )}
        <span className="flex-1" />
        {expiry && (
          <Badge variant={expiry.variant} className="shrink-0 text-[10px]">
            {expiry.label}
          </Badge>
        )}
      </div>
    </button>
  );
}
