import { useEffect, useRef } from "react";
import { Camera, KeyboardIcon, Loader2, Flashlight, FlashlightOff } from "lucide-react";
import { useBarcodeScanner } from "@/hooks/useBarcodeScanner";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onResult: (barcode: string) => void;
  onManualInput: () => void;
}

export function BarcodeScanner({ onResult, onManualInput }: BarcodeScannerProps) {
  const isClosingRef = useRef(false);

  const {
    state,
    error,
    elementId,
    startScanning,
    stopScanning,
    reset,
    isTorchAvailable,
    isTorchOn,
    toggleTorch,
    isScanning,
    isError,
  } = useBarcodeScanner({
    onScanSuccess: (barcode) => {
      isClosingRef.current = true;
      stopScanning();
      onResult(barcode);
    },
  });

  // Auto-start scanning al mount
  useEffect(() => {
    if (!isClosingRef.current) {
      const timer = setTimeout(startScanning, 300);
      return () => clearTimeout(timer);
    }
  }, [startScanning]);

  // Cleanup al unmount
  useEffect(() => {
    return () => {
      stopScanning();
      reset();
      isClosingRef.current = false;
    };
  }, [stopScanning, reset]);

  if (isError && error) {
    return (
      <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <Camera className="h-12 w-12 text-muted-foreground" strokeWidth={1.5} />
        <div>
          <p className="text-sm font-medium">Fotocamera non disponibile</p>
          <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onManualInput} className="gap-2">
            <KeyboardIcon className="h-4 w-4" />
            Inserisci manualmente
          </Button>
          <Button onClick={startScanning} className="gap-2">
            <Camera className="h-4 w-4" />
            Riprova
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="relative min-h-[256px] overflow-hidden rounded-2xl bg-black">
        <video
          id={elementId}
          className="h-64 w-full object-cover"
          style={{ display: state === "idle" ? "none" : "block" }}
        />

        {/* Torch toggle */}
        {isScanning && isTorchAvailable && (
          <button
            type="button"
            onClick={toggleTorch}
            className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors active:bg-black/70"
            aria-label={isTorchOn ? "Disattiva flash" : "Attiva flash"}
          >
            {isTorchOn ? (
              <Flashlight className="h-5 w-5" />
            ) : (
              <FlashlightOff className="h-5 w-5" />
            )}
          </button>
        )}

        {/* Scan overlay */}
        {isScanning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="h-32 w-48 rounded-lg border-2 border-primary/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]" />
            <div className="absolute h-0.5 w-40 animate-pulse bg-primary/80" />
          </div>
        )}

        {/* Loading overlay */}
        {state === "idle" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="h-8 w-8 animate-spin" />
              <p className="text-sm">Inizializzazione fotocamera...</p>
            </div>
          </div>
        )}
      </div>

      {/* Indicatore scanner attivo */}
      {isScanning && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          <p className="text-xs text-muted-foreground">
            Inquadra il codice a barre della confezione
          </p>
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Button variant="ghost" size="sm" onClick={onManualInput} className="gap-2 text-xs">
          <KeyboardIcon className="h-3.5 w-3.5" />
          Inserisci codice manualmente
        </Button>
      </div>
    </div>
  );
}
