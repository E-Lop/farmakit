# Roadmap Farmakit

## Fase 0 — Setup (attuale)
- [x] Struttura monorepo
- [x] Configurazione build e test
- [x] Schema database
- [x] Documentazione spec-driven
- [x] OpenAPI spec

## Fase 1 — MVP Core
- [ ] Autenticazione (login/signup email)
- [ ] CRUD armadietti
- [ ] Aggiunta farmaci manuale (nome custom)
- [ ] Lista farmaci con scadenze
- [ ] Layout mobile-first (BottomNav, PageLayout)
- [ ] Deploy su Netlify

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
