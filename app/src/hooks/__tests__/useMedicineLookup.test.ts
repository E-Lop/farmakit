import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { Medicine } from "@/types/medicine";

const mockSearchMedicines = vi.fn();
const mockLookupByBarcode = vi.fn();

vi.mock("@/lib/medicines", () => ({
  searchMedicines: (...args: unknown[]) => mockSearchMedicines(...args),
  lookupByBarcode: (...args: unknown[]) => mockLookupByBarcode(...args),
}));

import { useMedicineLookup } from "../useMedicineLookup";

const fakeMedicine: Medicine = {
  id: "med-1",
  aic_code: "012345",
  name: "Tachipirina 1000mg",
  active_ingredient: "Paracetamolo",
  manufacturer: "Angelini",
  atc_code: "N02BE01",
  package_description: "20 compresse",
  barcode: "8012345678901",
  source: "aifa",
  verified: true,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("useMedicineLookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("search ignora query con meno di 2 caratteri", async () => {
    const { result } = renderHook(() => useMedicineLookup());

    await act(async () => {
      await result.current.search("T");
    });

    expect(mockSearchMedicines).not.toHaveBeenCalled();
    expect(result.current.results).toEqual([]);
  });

  it("search restituisce risultati per query valida", async () => {
    mockSearchMedicines.mockResolvedValueOnce([fakeMedicine]);

    const { result } = renderHook(() => useMedicineLookup());

    await act(async () => {
      await result.current.search("Tachi");
    });

    expect(mockSearchMedicines).toHaveBeenCalledWith("Tachi");
    expect(result.current.results).toEqual([fakeMedicine]);
    expect(result.current.loading).toBe(false);
  });

  it("scanLookup restituisce farmaco per barcode trovato", async () => {
    mockLookupByBarcode.mockResolvedValueOnce(fakeMedicine);

    const { result } = renderHook(() => useMedicineLookup());

    let medicine: Medicine | null = null;
    await act(async () => {
      medicine = await result.current.scanLookup("8012345678901");
    });

    expect(mockLookupByBarcode).toHaveBeenCalledWith("8012345678901");
    expect(medicine).toEqual(fakeMedicine);
    expect(result.current.results).toEqual([fakeMedicine]);
  });

  it("scanLookup restituisce null per barcode non trovato", async () => {
    mockLookupByBarcode.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useMedicineLookup());

    let medicine: Medicine | null = null;
    await act(async () => {
      medicine = await result.current.scanLookup("0000000000000");
    });

    expect(medicine).toBeNull();
    expect(result.current.results).toEqual([]);
  });
});
