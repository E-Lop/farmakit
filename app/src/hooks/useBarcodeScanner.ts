import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface UseBarcodeScanner {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  result: string | null;
  error: string | null;
  scanning: boolean;
  startScan: () => void;
  stopScan: () => void;
}

export function useBarcodeScanner(): UseBarcodeScanner {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const stopScan = useCallback(() => {
    setScanning(false);
  }, []);

  const startScan = useCallback(() => {
    setResult(null);
    setError(null);
    setScanning(true);
  }, []);

  useEffect(() => {
    if (!scanning || !videoRef.current) return;

    const reader = new BrowserMultiFormatReader();
    readerRef.current = reader;

    reader
      .decodeFromVideoDevice(undefined, videoRef.current, (res, err) => {
        if (res) {
          setResult(res.getText());
          setScanning(false);
        }
        if (err && !(err instanceof TypeError)) {
          setError(err.message);
        }
      })
      .catch((err: Error) => setError(err.message));

    return () => {
      // Il cleanup avviene fermando lo stream
    };
  }, [scanning]);

  return { videoRef, result, error, scanning, startScan, stopScan };
}
