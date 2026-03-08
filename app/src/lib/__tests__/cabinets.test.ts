import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Cabinet } from "@/types/cabinet";
import { createQueryBuilder } from "@/test/supabase-mock";

// Mock del modulo supabase — deve precedere l'import del SUT
const mockFrom = vi.fn();
const mockGetUser = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: { getUser: () => mockGetUser() },
  },
}));

// Import SUT dopo il mock
import {
  getCabinets,
  createCabinet,
  updateCabinet,
  deleteCabinet,
} from "../cabinets";

const fakeCabinet: Cabinet = {
  id: "cab-1",
  name: "Casa",
  icon: null,
  owner_id: "user-123",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("cabinets CRUD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // getCabinets
  // ---------------------------------------------------------------------------
  describe("getCabinets", () => {
    it("restituisce la lista di armadietti con ruolo e conteggio membri", async () => {
      const builder = createQueryBuilder({
        data: [
          {
            role: "owner",
            cabinet: {
              ...fakeCabinet,
              cabinet_members: [{ count: 2 }],
            },
          },
        ],
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      const result = await getCabinets();

      expect(mockFrom).toHaveBeenCalledWith("cabinet_members");
      expect(result).toEqual([
        { ...fakeCabinet, cabinet_members: [{ count: 2 }], role: "owner", member_count: 2 },
      ]);
    });

    it("restituisce array vuoto se non ci sono armadietti", async () => {
      const builder = createQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      const result = await getCabinets();
      expect(result).toEqual([]);
    });

    it("lancia errore se la query fallisce", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "db error" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(getCabinets()).rejects.toEqual({ message: "db error" });
    });
  });

  // ---------------------------------------------------------------------------
  // createCabinet
  // ---------------------------------------------------------------------------
  describe("createCabinet", () => {
    it("crea un armadietto con owner_id dell'utente corrente", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const builder = createQueryBuilder({
        data: fakeCabinet,
        error: null,
      });
      mockFrom.mockReturnValue(builder);

      const result = await createCabinet("Casa");

      expect(mockFrom).toHaveBeenCalledWith("cabinets");
      expect(builder.insert).toHaveBeenCalledWith({
        name: "Casa",
        icon: undefined,
        owner_id: "user-123",
      });
      expect(result).toEqual(fakeCabinet);
    });

    it("lancia errore se utente non autenticato", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(createCabinet("Test")).rejects.toThrow("Non autenticato");
    });

    it("lancia errore se l'insert fallisce", async () => {
      mockGetUser.mockResolvedValue({
        data: { user: { id: "user-123" } },
        error: null,
      });

      const builder = createQueryBuilder({
        data: null,
        error: { message: "insert failed" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(createCabinet("Test")).rejects.toEqual({
        message: "insert failed",
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateCabinet
  // ---------------------------------------------------------------------------
  describe("updateCabinet", () => {
    it("aggiorna il nome dell'armadietto", async () => {
      const updated = { ...fakeCabinet, name: "Ufficio" };
      const builder = createQueryBuilder({ data: updated, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await updateCabinet("cab-1", { name: "Ufficio" });

      expect(mockFrom).toHaveBeenCalledWith("cabinets");
      expect(builder.update).toHaveBeenCalledWith({ name: "Ufficio" });
      expect(builder.eq).toHaveBeenCalledWith("id", "cab-1");
      expect(result).toEqual(updated);
    });

    it("lancia errore se l'update fallisce", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "update failed" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(
        updateCabinet("cab-1", { name: "Ufficio" }),
      ).rejects.toEqual({ message: "update failed" });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteCabinet
  // ---------------------------------------------------------------------------
  describe("deleteCabinet", () => {
    it("elimina l'armadietto per id", async () => {
      const builder = createQueryBuilder({ data: null, error: null });
      mockFrom.mockReturnValue(builder);

      await deleteCabinet("cab-1");

      expect(mockFrom).toHaveBeenCalledWith("cabinets");
      expect(builder.delete).toHaveBeenCalled();
      expect(builder.eq).toHaveBeenCalledWith("id", "cab-1");
    });

    it("lancia errore se la delete fallisce", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "delete failed" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(deleteCabinet("cab-1")).rejects.toEqual({
        message: "delete failed",
      });
    });
  });
});
