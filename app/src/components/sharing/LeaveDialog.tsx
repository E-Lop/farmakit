import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLeaveCabinet } from "@/hooks/useInvites";

interface LeaveDialogProps {
  cabinetId: string;
  cabinetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeaveDialog({
  cabinetId,
  cabinetName,
  open,
  onOpenChange,
}: LeaveDialogProps) {
  const leaveMutation = useLeaveCabinet();

  const handleLeave = async () => {
    try {
      await leaveMutation.mutateAsync(cabinetId);
      toast.success("Hai lasciato l'armadietto");
      onOpenChange(false);
    } catch {
      toast.error("Errore nell'uscita dall'armadietto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lascia armadietto</DialogTitle>
          <DialogDescription>
            Sei sicuro di voler lasciare <strong>{cabinetName}</strong>? Non
            vedrai più i farmaci di questo armadietto. Potrai rientrare solo con
            un nuovo invito dal proprietario.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annulla
          </Button>
          <Button
            variant="destructive"
            onClick={handleLeave}
            disabled={leaveMutation.isPending}
          >
            {leaveMutation.isPending ? "Uscita..." : "Lascia"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
