import { describe, it, expect, vi, beforeEach } from "vitest";
import type { UserMedicine, Medicine } from "@/types/medicine";
import { createQueryBuilder } from "@/test/supabase-mock";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

import {
  getUserMedicines,
  addUserMedicine,
  deleteUserMedicine,
  searchMedicines,
  lookupByBarcode,
} from "../medicines";

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

const fakeUserMedicine: UserMedicine = {
  id: "umed-1",
  cabinet_id: "cab-1",
  medicine_id: "med-1",
  custom_name: null,
  quantity: 2,
  expiry_date: "2027-06-15",
  notes: null,
  barcode: null,
  notify_before_days: 30,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
  medicine: fakeMedicine,
};

describe("medicines CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getUserMedicines
  // ---------------------------------------------------------------------------
  describe("getUserMedicines", () => {
    it("restituisce i farmaci di un armadietto ordinati per scadenza", async () => {
      const builder = createQueryBuilder({
        data: [fakeUserMedicine],
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      const result = await getUserMedicines("cab-1");

      expect(mockFrom).toHaveBeenCalledWith("user_medicines");
      expect(builder.select).toHaveBeenCalledWith("*, medicine:medicines(*)");
      expect(builder.eq).toHaveBeenCalledWith("cabinet_id", "cab-1");
      expect(builder.order).toHaveBeenCalledWith("expiry_date", {
        ascending: true,
      });
      expect(result).toEqual([fakeUserMedicine]);
    });

    it("restituisce array vuoto se l'armadietto è vuoto", async () => {
      const builder = createQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      const result = await getUserMedicines("cab-1");
      expect(result).toEqual([]);
    });

    it("lancia errore se la query fallisce", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "db error" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(getUserMedicines("cab-1")).rejects.toEqual({
        message: "db error",
      });
    });
  });

  // ---------------------------------------------------------------------------
  // addUserMedicine
  // ---------------------------------------------------------------------------
  describe("addUserMedicine", () => {
    it("aggiunge un farmaco all'armadietto", async () => {
      const builder = createQueryBuilder({
        data: fakeUserMedicine,
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      const formData = {
        cabinet_id: "cab-1",
        custom_name: "Tachipirina",
        quantity: 2,
        expiry_date: "2027-06-15",
        notify_before_days: 30,
      };

      const result = await addUserMedicine(formData);

      expect(mockFrom).toHaveBeenCalledWith("user_medicines");
      expect(builder.insert).toHaveBeenCalledWith(formData);
      expect(result).toEqual(fakeUserMedicine);
    });

    it("lancia errore se l'insert fallisce", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "RLS violation" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(
        addUserMedicine({
          cabinet_id: "cab-1",
          custom_name: "Test",
          quantity: 1,
          notify_before_days: 30,
        }),
      ).rejects.toEqual({ message: "RLS violation" });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteUserMedicine
  // ---------------------------------------------------------------------------
  describe("deleteUserMedicine", () => {
    it("elimina un farmaco per id", async () => {
      const builder = createQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await deleteUserMedicine("umed-1");

      expect(mockFrom).toHaveBeenCalledWith("user_medicines");
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "umed-1");
    });

    it("lancia errore se la delete fallisce", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "delete failed" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(deleteUserMedicine("umed-1")).rejects.toEqual({
        message: "delete failed",
      });
    });
  });

  // ---------------------------------------------------------------------------
  // searchMedicines
  // ---------------------------------------------------------------------------
  describe("searchMedicines", () => {
    it("cerca farmaci per nome, principio attivo o barcode", async () => {
      const builder = createQueryBuilder({
        data: [fakeMedicine],
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      const result = await searchMedicines("Tachi");

      expect(mockFrom).toHaveBeenCalledWith("medicines");
      expect(builder.or).toHaveBeenCalledWith(
        "name.ilike.%Tachi%,active_ingredient.ilike.%Tachi%,barcode.eq.Tachi",
      );
      expect(builder.limit).toHaveBeenCalledWith(20);
      expect(result).toEqual([fakeMedicine]);
    });

    it("restituisce array vuoto se nessun risultato", async () => {
      const builder = createQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      const result = await searchMedicines("inesistente");
      expect(result).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  // lookupByBarcode
  // ---------------------------------------------------------------------------
  describe("lookupByBarcode", () => {
    it("trova un farmaco dal barcode", async () => {
      const builder = createQueryBuilder({
        data: fakeMedicine,
        error: null,
      });
      builder.maybeSingle.mockResolvedValue({
        data: fakeMedicine,
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      const result = await lookupByBarcode("8012345678901");

      expect(mockFrom).toHaveBeenCalledWith("medicines");
      expect(builder.eq).toHaveBeenCalledWith("barcode", "8012345678901");
      expect(result).toEqual(fakeMedicine);
    });

    it("restituisce null se barcode non trovato", async () => {
      const builder = createQueryBuilder({ data: null, error: null });
      builder.maybeSingle.mockResolvedValue({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await lookupByBarcode("0000000000000");
      expect(result).toBeNull();
    });
  });
});
