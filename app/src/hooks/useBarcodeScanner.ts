import { useState, useCallback, useRef, useEffect } from "react";
import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser";
import type { IScannerControls } from "@zxing/browser";
import { NotFoundException } from "@zxing/library";

// Estendi i tipi MediaTrack per supportare torch (non presente in lib.dom standard)
interface TorchCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}
interface TorchConstraintSet extends MediaTrackConstraintSet {
  torch?: boolean;
}

export type ScannerState = "idle" | "scanning" | "processing" | "success" | "error";

interface UseBarcodeScannerOptions {
  onScanSuccess?: (barcode: string) => void;
  onScanError?: (error: Error) => void;
}

export function useBarcodeScanner({ onScanSuccess, onScanError }: UseBarcodeScannerOptions = {}) {
  const [state, setState] = useState<ScannerState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [scannedCode, setScannedCode] = useState<string | null>(null);
  const [isTorchAvailable, setIsTorchAvailable] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);

  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const mountedRef = useRef<boolean>(true);
  const hasScannedRef = useRef<boolean>(false);
  const elementIdRef = useRef<string>(`barcode-scanner-${Date.now()}`);

  const startScanning = useCallback(async () => {
    try {
      setState("scanning");
      setError(null);
      setScannedCode(null);
      hasScannedRef.current = false;

      if (!readerRef.current) {
        readerRef.current = new BrowserMultiFormatReader(undefined, {
          delayBetweenScanSuccess: 2000,
          delayBetweenScanAttempts: 600,
        });
      }

      const reader = readerRef.current;

      const videoElement = document.getElementById(elementIdRef.current) as HTMLVideoElement;
      if (!videoElement) throw new Error("Video element not found");

      videoRef.current = videoElement;

      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("API fotocamera non disponibile su questo browser");
      }

      // iOS fix: sempre undefined come deviceId, lasciamo il browser scegliere la camera
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoElement,
        (result, err, controls) => {
          if (!mountedRef.current) {
            controls.stop();
            return;
          }

          if (result && !hasScannedRef.current) {
            hasScannedRef.current = true;
            const barcode = result.getText();

            controls.stop();

            if (videoRef.current?.srcObject) {
              const stream = videoRef.current.srcObject as MediaStream;
              stream.getTracks().forEach((track) => track.stop());
              videoRef.current.srcObject = null;
            }

            setIsTorchAvailable(false);
            setIsTorchOn(false);
            setState("processing");
            setScannedCode(barcode);
            setState("success");
            onScanSuccess?.(barcode);
          }

          // NotFoundException è normale quando nessun codice è inquadrato — la ignoriamo
          if (err && !(err instanceof NotFoundException)) {
            console.warn("[BarcodeScanner] Errore durante la scansione:", err);
          }
        },
      );

      controlsRef.current = controls;

      // Rileva supporto torcia
      try {
        const stream = videoElement.srcObject as MediaStream | null;
        const track = stream?.getVideoTracks()[0];
        if (track) {
          const capabilities = track.getCapabilities() as TorchCapabilities;
          setIsTorchAvailable(!!capabilities.torch);
        }
      } catch {
        // Torch detection non supportata
      }
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Impossibile avviare la fotocamera. Controlla i permessi.";
      setState("error");
      setError(errorMsg);
      onScanError?.(err instanceof Error ? err : new Error(errorMsg));
    }
  }, [onScanSuccess, onScanError]);

  const stopScanning = useCallback(() => {
    try {
      hasScannedRef.current = false;

      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch {
          // Ignora errori di stop
        }
        controlsRef.current = null;
      }

      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }

      try {
        BrowserCodeReader.releaseAllStreams();
      } catch {
        // Ignora
      }

      if (videoRef.current) {
        try {
          BrowserCodeReader.cleanVideoSource(videoRef.current);
        } catch {
          // Ignora
        }
      }

      // Reset reader per forzare re-inizializzazione (fix iOS)
      readerRef.current = null;

      setIsTorchAvailable(false);
      setIsTorchOn(false);
      setState("idle");
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Errore durante la chiusura dello scanner";
      setError(errorMsg);
    }
  }, []);

  const reset = useCallback(() => {
    hasScannedRef.current = false;
    setState("idle");
    setError(null);
    setScannedCode(null);
  }, []);

  const toggleTorch = useCallback(async () => {
    try {
      const stream = videoRef.current?.srcObject as MediaStream | null;
      const track = stream?.getVideoTracks()[0];
      if (!track) return;

      const newTorchState = !isTorchOn;
      await track.applyConstraints({ advanced: [{ torch: newTorchState } as TorchConstraintSet] });
      setIsTorchOn(newTorchState);
    } catch {
      setIsTorchAvailable(false);
      setIsTorchOn(false);
    }
  }, [isTorchOn]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopScanning();
    };
  }, [stopScanning]);

  return {
    state,
    error,
    scannedCode,
    elementId: elementIdRef.current,
    startScanning,
    stopScanning,
    reset,
    isTorchAvailable,
    isTorchOn,
    toggleTorch,
    isScanning: state === "scanning",
    isProcessing: state === "processing",
    isSuccess: state === "success",
    isError: state === "error",
  };
}
