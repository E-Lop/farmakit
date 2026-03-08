import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Plus,
  Pill,
  AlertTriangle,
  Calendar,
  Archive,
} from "lucide-react";
import { differenceInDays, format, parseISO } from "date-fns";
import { it } from "date-fns/locale";
import { useCabinets } from "@/hooks/useCabinets";
import { useMedicines } from "@/hooks/useMedicines";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { UserMedicine } from "@/types/medicine";

export function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cabinetId = searchParams.get("cabinet");

  const { cabinets, isLoading: cabinetsLoading } = useCabinets();
  const activeCabinet = cabinetId
    ? cabinets.find((c) => c.id === cabinetId)
    : cabinets[0];

  const { medicines, isLoading: medsLoading } = useMedicines(
    activeCabinet?.id ?? null,
  );

  const isLoading = cabinetsLoading || medsLoading;

  return (
    <>
      <Header
        title={activeCabinet?.name ?? "Farmakit"}
        action={
          activeCabinet && (
            <Button
              size="sm"
              onClick={() =>
                navigate(`/add?cabinet=${activeCabinet.id}`)
              }
              className="gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Aggiungi</span>
            </Button>
          )
        }
      />

      <PageLayout>
        <DashboardContent
          isLoading={isLoading}
          cabinets={cabinets}
          medicines={medicines}
          onNavigateCabinets={() => navigate("/cabinets")}
          onAddMedicine={() => navigate(`/add?cabinet=${activeCabinet!.id}`)}
        />
      </PageLayout>
    </>
  );
}

interface DashboardContentProps {
  isLoading: boolean;
  cabinets: { id: string }[];
  medicines: UserMedicine[];
  onNavigateCabinets: () => void;
  onAddMedicine: () => void;
}

function DashboardContent({
  isLoading,
  cabinets,
  medicines,
  onNavigateCabinets,
  onAddMedicine,
}: DashboardContentProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (cabinets.length === 0) return <NoCabinetsState onNavigate={onNavigateCabinets} />;
  if (medicines.length === 0) return <EmptyMedicinesState onAdd={onAddMedicine} />;
  return <MedicineList medicines={medicines} />;
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-3 pt-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="h-[72px] animate-pulse rounded-xl bg-muted"
          style={{ animationDelay: `${i * 80}ms` }}
        />
      ))}
    </div>
  );
}

function NoCabinetsState({ onNavigate }: { onNavigate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-20 text-center animate-fade-in">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-accent">
        <Archive className="h-12 w-12 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Benvenuto su Farmakit</h2>
      <p className="mb-6 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
        Crea il tuo primo armadietto per iniziare a gestire i farmaci.
      </p>
      <Button
        onClick={onNavigate}
        size="lg"
        className="gap-2 rounded-full px-6"
      >
        <Plus className="h-4 w-4" />
        Vai agli armadietti
      </Button>
    </div>
  );
}

function EmptyMedicinesState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-20 text-center animate-fade-in">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-accent">
        <Pill className="h-12 w-12 text-primary" strokeWidth={1.5} />
      </div>
      <h2 className="mb-2 text-xl font-semibold">Armadietto vuoto</h2>
      <p className="mb-6 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
        Aggiungi il primo farmaco per tenere traccia delle scadenze.
      </p>
      <Button onClick={onAdd} size="lg" className="gap-2 rounded-full px-6">
        <Plus className="h-4 w-4" />
        Aggiungi farmaco
      </Button>
    </div>
  );
}

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

function MedicineList({ medicines }: { medicines: UserMedicine[] }) {
  return (
    <div className="flex flex-col gap-2 pt-2">
      {medicines.map((med, i) => {
        const displayName =
          med.medicine?.name ?? med.custom_name ?? "Farmaco senza nome";
        const expiry = getExpiryStatus(med.expiry_date);

        return (
          <div
            key={med.id}
            className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-sm animate-slide-up"
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent">
              {expiry?.variant === "destructive" ? (
                <AlertTriangle
                  className="h-5 w-5 text-destructive"
                  strokeWidth={1.5}
                />
              ) : (
                <Pill className="h-5 w-5 text-primary" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-card-foreground">
                {displayName}
              </p>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                {med.expiry_date && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(parseISO(med.expiry_date), "dd MMM yyyy", {
                      locale: it,
                    })}
                  </span>
                )}
                <span>Qtà: {med.quantity}</span>
              </div>
            </div>
            {expiry && (
              <Badge variant={expiry.variant} className="shrink-0 text-[10px]">
                {expiry.label}
              </Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
