# Roadmap Farmakit

## Fase 0 — Setup ✅
- [x] Struttura monorepo
- [x] Configurazione build e test
- [x] Schema database
- [x] Documentazione spec-driven
- [x] OpenAPI spec

## Fase 1 — MVP Core ✅
- [x] Progetto Supabase (farmakit, eu-west-1)
- [x] Migrazione schema DB applicata
- [x] Autenticazione (login/signup email)
- [x] CRUD armadietti (crea, modifica, elimina)
- [x] Aggiunta farmaci manuale (nome custom, quantità, scadenza, note)
- [x] Lista farmaci con scadenze e badge stato (scaduto, in scadenza)
- [x] Layout mobile-first (BottomNav, Header, PageLayout, AppShell)
- [x] Componenti shadcn/ui (button, input, label, card, dialog, badge, separator, tabs, sonner)
- [x] Test CRUD cabinets e medicines (30 test)
- [x] Deploy su Netlify (farmakit-app.netlify.app)
- [x] Dominio custom farmakit.it (DNS su Aruba)

## Fase 2 — Barcode + Catalogo ✅
- [x] Scanner barcode con @zxing (allineato a EntroApp: fix iOS, cleanup stream, torch toggle)
- [x] Import dataset AIFA (158.066 farmaci autorizzati caricati in DB)
- [x] Lookup farmaco da barcode (pagina Scan completa con camera + input manuale)
- [x] Ricerca farmaco per nome/principio attivo (componente MedicineSearch con debounce)
- [x] Associazione farmaco catalogo ↔ inventario (pre-fill AddMedicine da catalogo/scan)
- [x] Test hooks barcode e lookup (42 test totali)

## Fase 3 — Offline + PWA ✅
- [x] Service Worker custom con VitePWA (injectManifest, Workbox) — precache shell + runtime cache catalogo
- [x] Cache React Query in IndexedDB (PersistQueryClientProvider, 24h maxAge)
- [x] Mutation defaults per resume mutazioni offline dopo reload
- [x] Sync bidirezionale: Supabase Realtime (user_medicines, cabinet_members) con deduplication tracker
- [x] React Query onlineManager sincronizzato con eventi browser
- [x] Install prompt (beforeinstallprompt)
- [x] Update banner ("Nuova versione disponibile")
- [x] Offline banner (stato offline, sync in corso, mutazioni pendenti)

## Fase 4 — Condivisione ✅
- [x] Invito membri con short code (6 char, scadenza 7gg, Edge Function create-invite/accept-invite)
- [x] Gestione ruoli (owner/editor) con badge e permessi differenziati
- [x] Vista membri armadietto (MembersSheet con rimozione per owner)
- [x] Rimozione membri e uscita da armadietto condiviso (LeaveDialog + policy RLS self-removal)
- [x] Pagina /join/:code per accettazione inviti (con redirect login se non autenticato)
- [x] InviteDialog con codice visuale, copia link, Web Share API

## Fase 5 — Notifiche + Community ✅
- [x] Push notifications (VAPID + Web Push) — push subscribe/unsubscribe, SW handlers, sync
- [x] Preferenze notifiche (intervalli scadenza 30/7/1 giorni, quiet hours, timezone)
- [x] UI notifiche in Settings (toggle push, intervalli, quiet hours)
- [x] Edge Function send-expiry-notifications completata (batch DB, Web Push, cleanup subscription scadute)
- [x] Contribuzioni community (segnala nuovo farmaco, barcode, correzione dal flusso scan)
- [x] Auto-approvazione admin (contribuzioni da account admin applicate istantaneamente)
- [x] Approvazione per consenso pesato (trust weight utente, soglia cluster 3.0)
- [x] Pannello admin moderazione (/admin/contributions) con confidence score, trust badge, cluster info, cross-check catalogo
- [x] Edge Functions condivise (_shared/cors.ts, _shared/medicines.ts)
- [x] Test (56 test totali, 14 nuovi per push + contributions)

## Fase 6 — Polish
- [ ] Onboarding primo utilizzo — _da EntroApp: GuidaPage.tsx, InstructionCard.tsx_
- [ ] Tema scuro — _da EntroApp: useTheme.ts_
- [ ] Statistiche (farmaci totali, in scadenza, per armadietto)
- [ ] Export dati (GDPR) — _da EntroApp: dataExport.ts_
- [ ] Haptics — _da EntroApp: haptics.ts_
- [ ] Accessibilità (a11y audit)

## Futuro
- API pubblica documentata (inglese)
- App nativa (Capacitor o React Native)
- Integrazione con servizi sanitari regionali
- Promemoria assunzione farmaci
