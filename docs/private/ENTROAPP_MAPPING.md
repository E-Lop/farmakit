# Mappatura EntroApp → Farmakit

Riferimento: `~/Documents/entro`

EntroApp è un progetto con stack analogo (React 19, Supabase, Tailwind, shadcn/ui, @zxing, React Query, Zustand) le cui implementazioni sono testate in produzione e vanno riutilizzate come base per Farmakit laddove le funzionalità combacino.

## Fase 2 — Barcode + Catalogo ✅ (già applicato)

| Funzionalità | File EntroApp | File Farmakit | Note |
|---|---|---|---|
| Hook barcode scanner | `src/hooks/useBarcodeScanner.ts` | `app/src/hooks/useBarcodeScanner.ts` | Allineato: state machine, fix iOS, cleanup stream, torch, hasScannedRef |
| Componente scanner | `src/components/barcode/BarcodeScanner.tsx` | `app/src/components/barcode/BarcodeScanner.tsx` | Adattato da dialog a pagina inline |

## Fase 3 — Offline + PWA ✅ (già applicato)

| Funzionalità | File EntroApp | File Farmakit | Note |
|---|---|---|---|
| Service Worker (Workbox) | `src/sw.ts` | `app/src/sw.ts` | Semplificato: no Google Fonts, no Supabase Storage images. Solo precache + catalogo farmaci SWR |
| VitePWA config | `vite.config.ts` | `app/vite.config.ts` | `injectManifest` strategy, `registerType: "prompt"` |
| IndexedDB persister | `src/lib/queryPersister.ts` | `app/src/lib/queryPersister.ts` | Adattato chiave IDB a `farmakit-react-query-cache` |
| Mutation defaults | `src/lib/mutationDefaults.ts` | `app/src/lib/mutationDefaults.ts` | Keys: addMedicine, updateMedicine, deleteMedicine. No pending images |
| Realtime sync | `src/lib/realtime.ts` | `app/src/lib/realtime.ts` | Canali: user_medicines + cabinet_members. RecentMutationsTracker inline |
| Pending images | `src/lib/pendingImages.ts` | — | Non necessario per Farmakit (no immagini farmaci) |

## Fase 4 — Condivisione

| Funzionalità | File EntroApp | Adattamento Farmakit |
|---|---|---|
| Creazione inviti (short code 6 char) | `src/lib/invites.ts` | Cambiare `lists` → `cabinets`, `list_members` → `cabinet_members` |
| Edge Function inviti | `supabase/functions/create-invite/` | Adattare per cabinet_id invece di list_id |
| UI invito (genera + condividi) | `src/components/sharing/InviteDialog.tsx` | Riutilizzare con copy + Web Share API |
| UI accettazione invito | `src/components/sharing/AcceptInviteDialog.tsx` | Adattare per armadietti |
| Pagina /join/:code | `src/pages/JoinPage.tsx` | Stessa struttura: redirect a signup se non loggato |
| Uscita da lista condivisa | `src/components/sharing/LeaveListDialog.tsx` | Adattare per "lascia armadietto" |

### Differenze chiave
- EntroApp: un utente appartiene a una sola lista. Farmakit: un utente può avere più armadietti
- Il flusso inviti va adattato per essere cabinet-specific (non globale)
- I ruoli (owner/editor) sono già nel DB Farmakit via `cabinet_members.role`

## Fase 5 — Notifiche + Community

| Funzionalità | File EntroApp | Adattamento Farmakit |
|---|---|---|
| Push notifications setup | `src/lib/pushNotifications.ts` | Copia diretta — VAPID, SW registration, subscribe/unsubscribe |
| Hook subscription | `src/hooks/usePushSubscription.ts` | Stessa logica — stati: unsupported, prompt, subscribed, denied, ios-not-installed |
| Preferenze notifiche | `src/hooks/useNotificationPreferences.ts` | Adattare intervalli per scadenze farmaci (30/60/90 giorni vs. 1/3/7 giorni) |
| SW push handler | `src/sw.ts` (push/notificationclick) | Copia diretta — parse payload, show notification, click handler |
| Edge Function registrazione | `supabase/functions/register-push/` | Riutilizzabile |
| Moderazione contribuzioni | — | Non presente in EntroApp, da costruire ex novo |

### Pattern chiave
- **Three-state detection**: supporto browser → iOS PWA check → permission state
- **Timeout SW readiness**: 10s default per registrazione, 3s per refine
- **Quiet hours**: start/end configurabili (es. 22:00-08:00)
- **Idempotent unsubscribe**: nessun errore se non sottoscritto

## Fase 6 — Polish

| Funzionalità | File EntroApp | Adattamento Farmakit |
|---|---|---|
| Dark theme | `src/hooks/useTheme.ts` | Copia diretta — light/dark/system, localStorage, matchMedia listener |
| Onboarding guida | `src/pages/GuidaPage.tsx` | Struttura riutilizzabile, riscrivere contenuti per farmaci |
| Instruction card primo uso | `src/components/foods/InstructionCard.tsx` | Adattare per "primo farmaco" |
| Data export (GDPR) | `src/lib/dataExport.ts` | Adattare struttura: profilo + farmaci + armadietti (no immagini) |
| Haptics | `src/lib/haptics.ts` | Copia diretta — vibration API + web-haptics per iOS |
| Debounce hook | `src/hooks/useDebounce.ts` | Copia diretta |

## Funzionalità EntroApp NON applicabili a Farmakit

| Funzionalità | Motivo |
|---|---|
| Image compression/upload | Farmakit non gestisce immagini farmaci |
| Pending images (offline) | Come sopra |
| Swipeable cards | UX diversa — Farmakit usa lista con tap, non swipe |
| Open Food Facts API | Farmakit usa catalogo AIFA |
| Food categories/storage locations | Dominio diverso |
| Calendar view per scadenze | Potenzialmente utile in futuro, non in roadmap attuale |
