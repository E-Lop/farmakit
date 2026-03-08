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

## Fase 2 — Barcode + Catalogo
- [ ] Scanner barcode con @zxing
- [ ] Import dataset AIFA
- [ ] Lookup farmaco da barcode
- [ ] Ricerca farmaco per nome/principio attivo
- [ ] Associazione farmaco catalogo ↔ inventario

## Fase 3 — Offline + PWA
- [ ] Service Worker con vite-plugin-pwa
- [ ] Cache catalogo farmaci in IndexedDB
- [ ] Mutation queue per operazioni offline
- [ ] Sync bidirezionale online/offline
- [ ] Install prompt e update banner

## Fase 4 — Condivisione
- [ ] Invito membri per email
- [ ] Gestione ruoli (owner/editor)
- [ ] Vista membri armadietto
- [ ] Rimozione membri

## Fase 5 — Notifiche + Community
- [ ] Notifiche scadenza farmaci (in-app)
- [ ] Edge Function per notifiche push
- [ ] Contribuzioni community (nuovo farmaco, barcode, correzione)
- [ ] Moderazione contribuzioni (admin)

## Fase 6 — Polish
- [ ] Onboarding primo utilizzo
- [ ] Tema scuro
- [ ] Statistiche (farmaci totali, in scadenza, per armadietto)
- [ ] Export dati
- [ ] Accessibilità (a11y audit)

## Futuro
- API pubblica documentata (inglese)
- App nativa (Capacitor o React Native)
- Integrazione con servizi sanitari regionali
- Promemoria assunzione farmaci
