import { vi } from "vitest";

/**
 * Crea un mock del query builder Supabase con chaining fluido.
 * Ogni metodo restituisce il builder stesso, tranne il terminale che risolve il risultato.
 */
export function createQueryBuilder(result: { data: unknown; error: unknown }) {
  const builder: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "eq",
    "or",
    "order",
    "limit",
    "maybeSingle",
    "single",
  ];

  for (const method of methods) {
    builder[method] = vi.fn().mockReturnValue(builder);
  }

  // I metodi terminali risolvono la promise
  builder.single.mockResolvedValue(result);
  builder.maybeSingle.mockResolvedValue(result);

  // Se non c'è terminale, il builder stesso è thenable
  builder.then = vi
    .fn()
    .mockImplementation((resolve) => resolve(result));

  return builder;
}

/**
 * Crea un mock completo di `supabase.from()` che restituisce un query builder.
 */
export function mockSupabaseFrom(result: { data: unknown; error: unknown }) {
  const builder = createQueryBuilder(result);
  return vi.fn().mockReturnValue(builder);
}

/**
 * Mock per supabase.auth.getUser() che restituisce un utente autenticato.
 */
export function mockAuthGetUser(userId = "user-123") {
  return vi.fn().mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}
