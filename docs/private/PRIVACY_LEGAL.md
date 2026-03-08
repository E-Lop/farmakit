# Privacy e aspetti legali

## Dati trattati

### Dati utente
- Email (per autenticazione)
- Password (hash, gestito da Supabase Auth)
- UUID utente

### Dati farmaci
- Inventario personale (farmaci, quantità, scadenze)
- Condivisione: i dati degli armadietti condivisi sono visibili ai membri

### Dati catalogo
- Dati pubblici AIFA (non sensibili)
- Contribuzioni community (associate all'utente)

## Principi privacy

1. **Minimizzazione dati**: raccogliamo solo ciò che serve al funzionamento
2. **Nessun dato sanitario personale**: non registriamo diagnosi, prescrizioni, o informazioni mediche
3. **Controllo utente**: l'utente può eliminare i propri dati in qualsiasi momento
4. **Condivisione esplicita**: la condivisione avviene solo su invito esplicito dell'owner

## Sicurezza

- Autenticazione JWT con Supabase Auth
- RLS su tutte le tabelle (accesso basato su membership)
- Nessun dato in chiaro nel local storage (IndexedDB per dati offline)
- HTTPS obbligatorio in produzione
- Edge Functions con validazione input

## GDPR

### Diritti dell'interessato
- **Accesso**: l'utente vede tutti i propri dati nell'app
- **Rettifica**: l'utente può modificare i propri dati
- **Cancellazione**: eliminazione account rimuove tutti i dati (cascade)
- **Portabilità**: export dati in formato standard (feature futura)

### Base giuridica
- Consenso per la creazione account
- Legittimo interesse per il funzionamento del servizio

## Note

- L'app non raccoglie analytics per MVP
- Nessun cookie di terze parti
- I dati farmaci NON sono dati sanitari nel senso del GDPR Art. 9 (sono dati su prodotti, non su condizioni mediche dell'utente)
- Da valutare: privacy policy pubblica prima del lancio
