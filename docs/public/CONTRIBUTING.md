# Contribuire a Farmakit

Grazie per l'interesse nel contribuire a Farmakit! Questa guida spiega come partecipare.

## Come contribuire

### Segnalare bug
- Apri una issue descrivendo il problema
- Includi: passi per riprodurre, comportamento atteso vs. osservato, screenshot se possibile
- Indica il dispositivo e browser usato (l'app è ottimizzata per mobile)

### Proporre funzionalità
- Apri una issue con tag "feature request"
- Descrivi il caso d'uso e il beneficio per gli utenti

### Contribuire codice
1. Fai fork del repository
2. Crea un branch: `git checkout -b feature/nome-feature`
3. Sviluppa seguendo le convenzioni sotto
4. Scrivi/aggiorna i test
5. Apri una Pull Request

## Convenzioni

### Codice
- TypeScript strict mode
- Componenti React: function components con named exports
- Path alias: `@/` → `app/src/`
- Stile: Tailwind utility classes
- Naming: camelCase (variabili), PascalCase (componenti/tipi), kebab-case (file)

### Commit
- Messaggi in italiano o inglese
- Formato: `tipo: descrizione breve` (es. `fix: correggi validazione scadenza`)
- Tipi: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`

### Test
- Ogni feature deve avere test
- File `.test.ts(x)` co-locati o in `__tests__/`
- `npm test` deve passare prima di aprire PR

## Sviluppo locale

```bash
npm install
npm run dev          # Dev server
npm test             # Esegui test
npm run lint         # Linting
npm run typecheck    # Type check
```

## Catalogo community

Puoi contribuire al catalogo farmaci dall'app stessa:
- Aggiungendo farmaci non presenti nel database AIFA
- Associando barcode a farmaci esistenti
- Segnalando correzioni ai dati esistenti

Le contribuzioni vengono revisionate prima dell'approvazione.
