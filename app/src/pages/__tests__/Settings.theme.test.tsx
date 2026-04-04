import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock di tutte le dipendenze esterne
vi.mock("react-router-dom", () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { email: "test@test.com" }, signOut: vi.fn() }),
}));

vi.mock("@/hooks/useAdmin", () => ({
  useIsAdmin: () => false,
}));

vi.mock("@/hooks/usePushSubscription", () => ({
  usePushSubscription: () => ({
    status: "unsupported" as const,
    isLoading: false,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));

vi.mock("@/hooks/useNotificationPreferences", () => ({
  useNotificationPreferences: () => ({ data: null }),
  useUpdateNotificationPreferences: () => ({ mutate: vi.fn() }),
}));

const mockSetTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "system",
    setTheme: mockSetTheme,
    resolvedTheme: "light",
    themes: ["light", "dark", "system"],
  }),
}));

import { Settings } from "../Settings";

describe("Settings — selettore tema", () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it("mostra le tre opzioni tema: Sistema, Chiaro, Scuro", () => {
    render(<Settings />);

    expect(screen.getByText("Sistema")).toBeInTheDocument();
    expect(screen.getByText("Chiaro")).toBeInTheDocument();
    expect(screen.getByText("Scuro")).toBeInTheDocument();
  });

  it("mostra la sezione Aspetto", () => {
    render(<Settings />);

    expect(screen.getByText("Aspetto")).toBeInTheDocument();
  });

  it("chiama setTheme('dark') quando si clicca Scuro", () => {
    render(<Settings />);

    fireEvent.click(screen.getByText("Scuro"));

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("chiama setTheme('light') quando si clicca Chiaro", () => {
    render(<Settings />);

    fireEvent.click(screen.getByText("Chiaro"));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });

  it("chiama setTheme('system') quando si clicca Sistema", () => {
    render(<Settings />);

    fireEvent.click(screen.getByText("Sistema"));

    expect(mockSetTheme).toHaveBeenCalledWith("system");
  });

  it("evidenzia il bottone attivo con lo stile primary", () => {
    render(<Settings />);

    const sistemaButton = screen.getByText("Sistema").closest("button")!;
    expect(sistemaButton.className).toContain("bg-primary");

    const scuroButton = screen.getByText("Scuro").closest("button")!;
    expect(scuroButton.className).toContain("bg-muted");
  });
});
