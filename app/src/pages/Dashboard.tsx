import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Plus, Pill, Archive } from "lucide-react";
import { toast } from "sonner";
import { useCabinets } from "@/hooks/useCabinets";
import { useMedicines } from "@/hooks/useMedicines";
import { useCabinetAlerts, type CabinetAlerts } from "@/hooks/useCabinetAlerts";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MedicineCard } from "@/components/medicines/medicine-card";
import { MedicineDetailDrawer } from "@/components/medicines/medicine-detail-drawer";
import type { Cabinet } from "@/types/cabinet";
import type { UserMedicine } from "@/types/medicine";

export function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const cabinetId = searchParams.get("cabinet");

  const { cabinets, isLoading: cabinetsLoading } = useCabinets();
  const activeCabinet = cabinetId
    ? cabinets.find((c) => c.id === cabinetId)
    : cabinets[0];

  const { medicines, isLoading: medsLoading, updateMedicine, deleteMedicine } =
    useMedicines(activeCabinet?.id ?? null);

  const alertsByCabinet = useCabinetAlerts(cabinets.map((c) => c.id));

  const isLoading = cabinetsLoading || medsLoading;

  const [selectedMedicine, setSelectedMedicine] = useState<UserMedicine | null>(null);

  const handleSelectCabinet = (id: string) => {
    setSearchParams({ cabinet: id });
  };

  const handleQuantityChange = async (med: UserMedicine, newQuantity: number) => {
    try {
      await updateMedicine({ id: med.id, updates: { quantity: newQuantity } });
    } catch {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleUpdate = async (id: string, updates: Parameters<typeof updateMedicine>[0]["updates"]) => {
    try {
      await updateMedicine({ id, updates });
      toast.success("Farmaco aggiornato");
    } catch {
      toast.error("Errore nell'aggiornamento");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMedicine(id);
      toast.success("Farmaco eliminato");
    } catch {
      toast.error("Errore nell'eliminazione");
    }
  };

  return (
    <>
      <Header
        title="Farmakit"
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
        {cabinets.length > 1 && (
          <CabinetTabs
            cabinets={cabinets}
            activeId={activeCabinet?.id ?? null}
            onSelect={handleSelectCabinet}
            alertsByCabinet={alertsByCabinet}
          />
        )}

        <DashboardContent
          isLoading={isLoading}
          cabinets={cabinets}
          medicines={medicines}
          onNavigateCabinets={() => navigate("/cabinets")}
          onAddMedicine={() => navigate(`/add?cabinet=${activeCabinet!.id}`)}
          onTapMedicine={setSelectedMedicine}
          onQuantityChange={handleQuantityChange}
        />
      </PageLayout>

      <MedicineDetailDrawer
        medicine={selectedMedicine}
        open={selectedMedicine !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedMedicine(null);
        }}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
    </>
  );
}

function CabinetTabs({
  cabinets,
  activeId,
  onSelect,
  alertsByCabinet,
}: {
  cabinets: Cabinet[];
  activeId: string | null;
  onSelect: (id: string) => void;
  alertsByCabinet: Record<string, CabinetAlerts>;
}) {
  return (
    <div className="-mx-4 mb-3 overflow-x-auto px-4 pt-2">
      <div className="flex gap-3 pr-2">
        {cabinets.map((cab) => {
          const isActive = cab.id === activeId;
          const alerts = alertsByCabinet[cab.id];
          return (
            <button
              key={cab.id}
              type="button"
              onClick={() => onSelect(cab.id)}
              className={cn(
                "relative shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground",
              )}
            >
              {cab.icon && <span className="mr-1.5">{cab.icon}</span>}
              {cab.name}
              {alerts && alerts.total > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {alerts.total}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface DashboardContentProps {
  isLoading: boolean;
  cabinets: { id: string }[];
  medicines: UserMedicine[];
  onNavigateCabinets: () => void;
  onAddMedicine: () => void;
  onTapMedicine: (med: UserMedicine) => void;
  onQuantityChange: (med: UserMedicine, newQuantity: number) => void;
}

function DashboardContent({
  isLoading,
  cabinets,
  medicines,
  onNavigateCabinets,
  onAddMedicine,
  onTapMedicine,
  onQuantityChange,
}: DashboardContentProps) {
  if (isLoading) return <LoadingSkeleton />;
  if (cabinets.length === 0) return <NoCabinetsState onNavigate={onNavigateCabinets} />;
  if (medicines.length === 0) return <EmptyMedicinesState onAdd={onAddMedicine} />;

  return (
    <div className="flex flex-col gap-2 pt-2">
      {medicines.map((med, i) => (
        <MedicineCard
          key={med.id}
          medicine={med}
          index={i}
          onTap={() => onTapMedicine(med)}
          onQuantityChange={(qty) => onQuantityChange(med, qty)}
        />
      ))}
    </div>
  );
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
