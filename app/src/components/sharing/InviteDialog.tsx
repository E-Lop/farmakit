import { useEffect, useRef, useState } from "react";
import { Copy, Check, Share2 } from "lucide-react";
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
import { useCreateInvite } from "@/hooks/useInvites";

interface InviteDialogProps {
  cabinetId: string;
  cabinetName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteDialog({
  cabinetId,
  cabinetName,
  open,
  onOpenChange,
}: InviteDialogProps) {
  const [shortCode, setShortCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const createInvite = useCreateInvite();
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    return () => clearTimeout(copiedTimerRef.current);
  }, []);

  const handleGenerate = async () => {
    try {
      const code = await createInvite.mutateAsync(cabinetId);
      setShortCode(code);
    } catch {
      toast.error("Errore nella creazione dell'invito");
    }
  };

  const inviteUrl = shortCode
    ? `${window.location.origin}/join/${shortCode}`
    : "";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success("Link copiato!");
      copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossibile copiare il link");
    }
  };

  const handleShare = async () => {
    if (!navigator.share) {
      handleCopy();
      return;
    }
    try {
      await navigator.share({
        title: `Unisciti a "${cabinetName}" su Farmakit`,
        text: `Usa il codice ${shortCode} oppure apri il link per unirti al mio armadietto farmaci.`,
        url: inviteUrl,
      });
    } catch (err) {
      // L'utente ha annullato la condivisione — ignora
      if (err instanceof Error && err.name !== "AbortError") {
        handleCopy();
      }
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setShortCode(null);
      setCopied(false);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Condividi armadietto</DialogTitle>
          <DialogDescription>
            {shortCode
              ? "Condividi questo codice o link con chi vuoi invitare. Il codice scade tra 7 giorni."
              : `Genera un codice per invitare qualcuno a "${cabinetName}".`}
          </DialogDescription>
        </DialogHeader>

        {shortCode ? (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-center rounded-xl bg-accent p-6">
              <span className="font-mono text-3xl font-bold tracking-[0.3em] text-foreground">
                {shortCode}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopy}
              >
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
                {copied ? "Copiato" : "Copia link"}
              </Button>
              <Button className="flex-1 gap-2" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
                Condividi
              </Button>
            </div>
          </div>
        ) : (
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Annulla
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={createInvite.isPending}
            >
              {createInvite.isPending ? "Generazione..." : "Genera codice"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
