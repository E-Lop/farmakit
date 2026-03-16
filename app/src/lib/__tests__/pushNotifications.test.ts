import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock supabase prima dell'import del modulo
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      }),
    },
  },
}));

// Mock import.meta.env
vi.stubEnv("VITE_VAPID_PUBLIC_KEY", "BNtest-vapid-key-base64url");
vi.stubEnv("VITE_SUPABASE_URL", "https://test.supabase.co");

describe("pushNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("isPushSupported", () => {
    it("ritorna true se browser supporta push", async () => {
      // Setup: navigator ha serviceWorker, PushManager e Notification
      Object.defineProperty(globalThis, "PushManager", { value: {}, configurable: true });
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "default" },
        configurable: true,
      });
      Object.defineProperty(navigator, "serviceWorker", {
        value: { ready: Promise.resolve({}) },
        configurable: true,
      });

      const { isPushSupported } = await import("../pushNotifications");
      expect(isPushSupported()).toBe(true);
    });
  });

  describe("isPWAInstalled", () => {
    it("ritorna false su browser desktop", async () => {
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn().mockReturnValue({ matches: false }),
        configurable: true,
      });

      const { isPWAInstalled } = await import("../pushNotifications");
      expect(isPWAInstalled()).toBe(false);
    });

    it("ritorna true in standalone mode", async () => {
      Object.defineProperty(window, "matchMedia", {
        value: vi.fn().mockReturnValue({ matches: true }),
        configurable: true,
      });

      const { isPWAInstalled } = await import("../pushNotifications");
      expect(isPWAInstalled()).toBe(true);
    });
  });

  describe("isIOS", () => {
    it("ritorna false su Android", async () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (Linux; Android 13)",
        configurable: true,
      });
      Object.defineProperty(navigator, "platform", {
        value: "Linux",
        configurable: true,
      });
      Object.defineProperty(navigator, "maxTouchPoints", {
        value: 5,
        configurable: true,
      });

      const { isIOS } = await import("../pushNotifications");
      expect(isIOS()).toBe(false);
    });

    it("ritorna true su iPhone", async () => {
      Object.defineProperty(navigator, "userAgent", {
        value: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
        configurable: true,
      });

      const { isIOS } = await import("../pushNotifications");
      expect(isIOS()).toBe(true);
    });
  });

  describe("getPermissionState", () => {
    it("ritorna stato permission di Notification", async () => {
      Object.defineProperty(globalThis, "Notification", {
        value: { permission: "granted" },
        configurable: true,
      });

      const { getPermissionState } = await import("../pushNotifications");
      expect(getPermissionState()).toBe("granted");
    });
  });

  describe("getCurrentSubscription", () => {
    it("ritorna null se push non supportato", async () => {
      // Rimuovi PushManager per simulare browser non supportato
      const original = globalThis.PushManager;
      Object.defineProperty(globalThis, "PushManager", {
        value: undefined,
        configurable: true,
      });

      const mod = await import("../pushNotifications");
      const result = await mod.getCurrentSubscription();
      expect(result).toBeNull();

      // Ripristina
      Object.defineProperty(globalThis, "PushManager", {
        value: original,
        configurable: true,
      });
    });
  });

  describe("unsubscribeFromPush", () => {
    it("ritorna success se non c'è subscription", async () => {
      // Forza isPushSupported = false per far ritornare null da getCurrentSubscription
      const original = globalThis.PushManager;
      Object.defineProperty(globalThis, "PushManager", {
        value: undefined,
        configurable: true,
      });

      const mod = await import("../pushNotifications");
      const result = await mod.unsubscribeFromPush();
      expect(result.success).toBe(true);

      Object.defineProperty(globalThis, "PushManager", {
        value: original,
        configurable: true,
      });
    });
  });
});
