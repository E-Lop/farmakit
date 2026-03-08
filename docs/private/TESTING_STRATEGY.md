# Strategia di testing

## Framework

- **Vitest** — test runner per tutti i workspace
- **Testing Library** — test componenti React
- **jsdom** — ambiente DOM per test frontend

## Struttura

```
app/src/
├── lib/__tests__/        Unit test logica business
├── hooks/__tests__/      Test custom hooks (futuro)
├── components/__tests__/ Test componenti (futuro)
└── test/setup.ts         Setup globale test

data/src/
└── __tests__/            Test pipeline import
```

## Livelli di test

### Unit test
- Funzioni pure (validazione, normalizzazione, utilità)
- Stores Zustand
- Custom hooks (con renderHook)
- Priorità alta, copertura obiettivo: 80%+

### Integration test
- Flussi completi (es. scansione → lookup → salvataggio)
- Interazione con Supabase client (mock)
- Componenti con hook reali

### E2E test (futuro)
- Flussi critici: login, aggiunta farmaco, scansione
- Playwright o Cypress
- Solo percorsi happy path per MVP

## Convenzioni

- File test: `*.test.ts(x)` co-locati o in `__tests__/`
- Nomenclatura test in italiano (descrizione funzionalità)
- Ogni test è indipendente (no stato condiviso)
- Mock: mock Supabase client, non il database

## Comandi

```bash
npm test                   # Tutti i test (tutti i workspace)
npm test -- --watch        # Watch mode
npm run test:coverage      # Con coverage report
npm test -w app            # Solo workspace app
npm test -w data           # Solo workspace data
```

## Mock

### Supabase client
```typescript
vi.mock("@/lib/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    // ...
  },
}));
```

### IndexedDB
```typescript
vi.mock("idb-keyval", () => ({
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  keys: vi.fn().mockResolvedValue([]),
}));
```

## Priorità test per MVP

1. Validazione form farmaco
2. Normalizzazione dati AIFA
3. Parsing CSV
4. Mutation queue (sync offline)
5. Barcode scanner hook
