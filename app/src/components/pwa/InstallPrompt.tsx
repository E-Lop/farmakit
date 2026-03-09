import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between gap-2 rounded-xl bg-card p-4 shadow-lg border">
      <div className="flex-1">
        <p className="text-sm font-medium">Installa Farmakit</p>
        <p className="text-xs text-muted-foreground">Accedi rapidamente dalla schermata home</p>
      </div>
      <Button size="sm" onClick={handleInstall}>
        <Download className="mr-1 h-4 w-4" />
        Installa
      </Button>
      <button
        onClick={() => setDismissed(true)}
        className="text-muted-foreground p-1"
        aria-label="Chiudi"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
