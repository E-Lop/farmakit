import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useThemeColor } from "../useThemeColor";

vi.mock("next-themes", () => ({
  useTheme: vi.fn(),
}));

import { useTheme } from "next-themes";

const mockUseTheme = vi.mocked(useTheme);

describe("useThemeColor", () => {
  let metaTag: HTMLMetaElement;

  beforeEach(() => {
    metaTag = document.createElement("meta");
    metaTag.name = "theme-color";
    metaTag.content = "#16a34a";
    document.head.appendChild(metaTag);

    return () => {
      metaTag.remove();
    };
  });

  it("imposta il colore chiaro quando il tema è light", () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: "light",
      theme: "light",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
    });

    renderHook(() => useThemeColor());

    expect(metaTag.content).toBe("#16a34a");
  });

  it("imposta il colore scuro quando il tema è dark", () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: "dark",
      theme: "dark",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
    });

    renderHook(() => useThemeColor());

    expect(metaTag.content).toBe("#0a0a0a");
  });

  it("usa il colore chiaro come fallback per tema sconosciuto", () => {
    mockUseTheme.mockReturnValue({
      resolvedTheme: undefined,
      theme: "system",
      setTheme: vi.fn(),
      themes: ["light", "dark", "system"],
    });

    renderHook(() => useThemeColor());

    expect(metaTag.content).toBe("#16a34a");
  });
});
