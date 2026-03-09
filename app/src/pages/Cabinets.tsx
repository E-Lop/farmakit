import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Archive,
  Plus,
  Users,
  PackageOpen,
} from "lucide-react";
import { useCabinets } from "@/hooks/useCabinets";
import { Header } from "@/components/layout/Header";
import { PageLayout } from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CabinetDetailDrawer } from "@/components/cabinets/cabinet-detail-drawer";
import type { CabinetWithRole } from "@/types/cabinet";

type DialogMode =
  | { type: "create" }
  | { type: "edit"; cabinet: CabinetWithRole }
  | { type: "delete"; cabinet: CabinetWithRole }
  | null;

function getDialogSubmitLabel(submitting: boolean, isCreate: boolean): string {
  if (submitting) return "Salvataggio...";
  return isCreate ? "Crea" : "Salva";
}

export function Cabinets() {
  const navigate = useNavigate();
  const { cabinets, isLoading, createCabinet, updateCabinet, deleteCabinet } =
    useCabinets();
  const [dialog, setDialog] = useState<DialogMode>(null);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [drawerCabinet, setDrawerCabinet] = useState<CabinetWithRole | null>(null);

  const openCreate = () => {
    setName("");
    setDialog({ type: "create" });
  };

  const openEdit = (cabinet: CabinetWithRole) => {
    setName(cabinet.name);
    setDialog({ type: "edit", cabinet });
  };

  const openDelete = (cabinet: CabinetWithRole) => {
    setDialog({ type: "delete", cabinet });
  };

  const handleCreateOrEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);

    try {
      if (dialog?.type === "create") {
        await createCabinet({ name: name.trim() });
        toast.success("Armadietto creato");
      } else if (dialog?.type === "edit") {
        await updateCabinet({
          id: dialog.cabinet.id,
          updates: { name: name.trim() },
        });
        toast.success("Armadietto aggiornato");
      }
      setDialog(null);
    } catch {
      toast.error("Errore nel salvataggio");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (dialog?.type !== "delete") return;
    setSubmitting(true);
    try {
      await deleteCabinet(dialog.cabinet.id);
      toast.success("Armadietto eliminato");
      setDialog(null);
    } catch {
      toast.error("Errore nell'eliminazione");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Header
        title="Armadietti"
        action={
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            <span>Nuovo</span>
          </Button>
        }
      />

      <PageLayout>
        <CabinetsContent
          isLoading={isLoading}
          cabinets={cabinets}
          onCreate={openCreate}
          onTap={setDrawerCabinet}
        />
      </PageLayout>

      <CabinetDetailDrawer
        cabinet={drawerCabinet}
        open={drawerCabinet !== null}
        onOpenChange={(open) => {
          if (!open) setDrawerCabinet(null);
        }}
        onNavigate={() => navigate(`/?cabinet=${drawerCabinet!.id}`)}
        onEdit={() => openEdit(drawerCabinet!)}
        onDelete={() => openDelete(drawerCabinet!)}
      />

      {/* Create / Edit dialog */}
      <Dialog
        open={dialog?.type === "create" || dialog?.type === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.type === "create"
                ? "Nuovo armadietto"
                : "Modifica armadietto"}
            </DialogTitle>
            <DialogDescription>
              {dialog?.type === "create"
                ? "Crea un nuovo armadietto per organizzare i tuoi farmaci."
                : "Modifica il nome del tuo armadietto."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateOrEdit}>
            <div className="space-y-2 py-2">
              <Label htmlFor="cabinet-name">Nome</Label>
              <Input
                id="cabinet-name"
                placeholder="Es. Casa, Ufficio, Viaggio..."
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
                required
              />
            </div>
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={submitting || !name.trim()}>
                {getDialogSubmitLabel(submitting, dialog?.type === "create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={dialog?.type === "delete"}
        onOpenChange={(open) => !open && setDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Elimina armadietto</DialogTitle>
            <DialogDescription>
              Sei sicuro di voler eliminare{" "}
              <strong>
                {dialog?.type === "delete" ? dialog.cabinet.name : ""}
              </strong>
              ? Tutti i farmaci al suo interno verranno rimossi. Questa azione
              non è reversibile.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Annulla
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
            >
              {submitting ? "Eliminazione..." : "Elimina"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface CabinetsContentProps {
  isLoading: boolean;
  cabinets: CabinetWithRole[];
  onCreate: () => void;
  onTap: (cabinet: CabinetWithRole) => void;
}

function CabinetsContent({
  isLoading,
  cabinets,
  onCreate,
  onTap,
}: CabinetsContentProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 pt-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-20 animate-pulse rounded-xl bg-muted"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        ))}
      </div>
    );
  }

  if (cabinets.length === 0) {
    return <EmptyState onCreate={onCreate} />;
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      {cabinets.map((cabinet, i) => (
        <CabinetCard
          key={cabinet.id}
          cabinet={cabinet}
          index={i}
          onTap={() => onTap(cabinet)}
        />
      ))}
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 pt-20 text-center animate-fade-in">
      <div className="relative mb-6">
        <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-accent">
          <PackageOpen className="h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>
        <div className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary shadow-md">
          <Plus className="h-4 w-4 text-primary-foreground" />
        </div>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">
        Nessun armadietto
      </h2>
      <p className="mb-6 max-w-[260px] text-sm leading-relaxed text-muted-foreground">
        Crea il tuo primo armadietto per iniziare a tenere traccia dei farmaci e
        delle scadenze.
      </p>
      <Button onClick={onCreate} size="lg" className="gap-2 rounded-full px-6">
        <Plus className="h-4 w-4" />
        Crea armadietto
      </Button>
    </div>
  );
}

function CabinetCard({
  cabinet,
  index,
  onTap,
}: {
  cabinet: CabinetWithRole;
  index: number;
  onTap: () => void;
}) {
  const isOwner = cabinet.role === "owner";

  return (
    <div
      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow active:shadow-md animate-slide-up"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <button
        type="button"
        onClick={onTap}
        className="flex w-full items-center gap-4 p-4 text-left"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent">
          <Archive className="h-6 w-6 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate text-base font-medium text-card-foreground">
              {cabinet.name}
            </span>
            <Badge
              variant={isOwner ? "default" : "secondary"}
              className="shrink-0 text-[10px] px-1.5 py-0"
            >
              {isOwner ? "Proprietario" : "Editor"}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>
              {cabinet.member_count}{" "}
              {cabinet.member_count === 1 ? "membro" : "membri"}
            </span>
          </div>
        </div>
      </button>
    </div>
  );
}
