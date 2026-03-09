import { useRegisterSW } from "virtual:pwa-register/react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function UpdateBanner() {
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between gap-2 bg-primary px-4 py-3 text-primary-foreground shadow-lg">
      <span className="text-sm font-medium">Nuova versione disponibile</span>
      <Button
        size="sm"
        variant="secondary"
        onClick={() => updateServiceWorker(true)}
      >
        <RefreshCw className="mr-1 h-4 w-4" />
        Aggiorna
      </Button>
    </div>
  );
}
