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

## Fase 3 — Offline + PWA
- [ ] Service Worker con VitePWA (injectManifest, Workbox) — _da EntroApp: sw.ts, vite.config.ts_
- [ ] Cache catalogo farmaci in IndexedDB — _da EntroApp: queryPersister.ts_
- [ ] Mutation queue per operazioni offline — _da EntroApp: mutationDefaults.ts_
- [ ] Sync bidirezionale online/offline — _da EntroApp: realtime.ts_
- [ ] Install prompt e update banner

## Fase 4 — Condivisione
- [ ] Invito membri con short code — _da EntroApp: invites.ts, Edge Function_
- [ ] Gestione ruoli (owner/editor)
- [ ] Vista membri armadietto — _da EntroApp: sharing/ components_
- [ ] Rimozione membri e uscita da armadietto condiviso

## Fase 5 — Notifiche + Community
- [ ] Notifiche scadenza farmaci (in-app)
- [ ] Push notifications (VAPID + Web Push) — _da EntroApp: pushNotifications.ts, sw.ts push handler_
- [ ] Preferenze notifiche (quiet hours, intervalli) — _da EntroApp: useNotificationPreferences.ts_
- [ ] Contribuzioni community (nuovo farmaco, barcode, correzione)
- [ ] Moderazione contribuzioni (admin) — _da costruire ex novo_

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
