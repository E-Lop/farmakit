import { describe, it, expect, vi, beforeEach } from "vitest";
import { createQueryBuilder } from "@/test/supabase-mock";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => mockFrom(...args),
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
  },
}));

// Mock import.meta.env
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

import { submitContribution, fetchMyContributions } from "../contributions";

describe("contributions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("submitContribution", () => {
    it("invia una contribuzione e ritorna il risultato", async () => {
      const fakeContribution = {
        id: "contrib-1",
        contribution_type: "new_medicine",
        data: { name: "Tachipirina", barcode: "123" },
        status: "pending",
        created_at: "2026-03-16T00:00:00Z",
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: fakeContribution }),
      });

      const result = await submitContribution("new_medicine", {
        name: "Tachipirina",
        barcode: "123",
      });

      expect(result).toEqual(fakeContribution);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/submit-contribution"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("lancia errore se non autenticato", async () => {
      const { supabase } = await import("@/lib/supabase");
      vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
        data: { session: null },
        error: null,
      } as never);

      await expect(
        submitContribution("new_medicine", { name: "Test" }),
      ).rejects.toThrow("Non autenticato");
    });

    it("lancia errore se la risposta non è ok", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: "Errore server" }),
      });

      await expect(
        submitContribution("new_medicine", { name: "Test" }),
      ).rejects.toThrow("Errore server");
    });
  });

  describe("fetchMyContributions", () => {
    it("restituisce le contribuzioni dell'utente", async () => {
      const fakeList = [
        {
          id: "contrib-1",
          contribution_type: "new_medicine",
          data: { name: "Test" },
          status: "pending",
          created_at: "2026-03-16T00:00:00Z",
        },
      ];

      const builder = createQueryBuilder({ data: fakeList, error: null });
      mockFrom.mockReturnValue(builder);

      const result = await fetchMyContributions();

      expect(mockFrom).toHaveBeenCalledWith("community_contributions");
      expect(builder.select).toHaveBeenCalledWith(
        "id, contribution_type, data, status, created_at",
      );
      expect(builder.order).toHaveBeenCalledWith("created_at", {
        ascending: false,
      });
      expect(builder.limit).toHaveBeenCalledWith(50);
      expect(result).toEqual(fakeList);
    });

    it("restituisce array vuoto se non ci sono contribuzioni", async () => {
      const builder = createQueryBuilder({ data: [], error: null });
      mockFrom.mockReturnValue(builder);

      const result = await fetchMyContributions();
      expect(result).toEqual([]);
    });

    it("lancia errore se la query fallisce", async () => {
      const builder = createQueryBuilder({
        data: null,
        error: { message: "db error" },
      });
      mockFrom.mockReturnValue(builder);

      await expect(fetchMyContributions()).rejects.toEqual({
        message: "db error",
      });
    });
  });
});
