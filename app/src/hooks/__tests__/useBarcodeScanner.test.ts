import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockDecodeFromVideoDevice = vi.fn();
const mockStop = vi.fn();
const mockReleaseAllStreams = vi.fn();
const mockCleanVideoSource = vi.fn();

vi.mock("@zxing/browser", () => ({
  BrowserMultiFormatReader: vi.fn().mockImplementation(() => ({
    decodeFromVideoDevice: mockDecodeFromVideoDevice,
  })),
  BrowserCodeReader: {
    releaseAllStreams: () => mockReleaseAllStreams(),
    cleanVideoSource: () => mockCleanVideoSource(),
  },
}));

vi.mock("@zxing/library", () => ({
  NotFoundException: class NotFoundException extends Error {
    constructor() {
      super("Not found");
      this.name = "NotFoundException";
    }
  },
}));

import { useBarcodeScanner } from "../useBarcodeScanner";

describe("useBarcodeScanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDecodeFromVideoDevice.mockResolvedValue({ stop: mockStop });
  });

  it("inizializza con stato idle", () => {
    const { result } = renderHook(() => useBarcodeScanner());

    expect(result.current.state).toBe("idle");
    expect(result.current.isScanning).toBe(false);
    expect(result.current.scannedCode).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.isTorchAvailable).toBe(false);
    expect(result.current.isTorchOn).toBe(false);
  });

  it("espone un elementId unico per il video", () => {
    const { result } = renderHook(() => useBarcodeScanner());
    expect(result.current.elementId).toMatch(/^barcode-scanner-\d+$/);
  });

  it("stopScanning resetta lo stato a idle", async () => {
    const { result } = renderHook(() => useBarcodeScanner());

    await act(async () => {
      await result.current.stopScanning();
    });

    expect(result.current.state).toBe("idle");
    expect(result.current.error).toBeNull();
  });

  it("reset pulisce lo stato", () => {
    const { result } = renderHook(() => useBarcodeScanner());

    act(() => result.current.reset());

    expect(result.current.state).toBe("idle");
    expect(result.current.scannedCode).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("accetta callback onScanSuccess", () => {
    const onScanSuccess = vi.fn();
    const { result } = renderHook(() =>
      useBarcodeScanner({ onScanSuccess }),
    );
    expect(result.current.state).toBe("idle");
  });
});
