# Linee guida UX

## Principi

### Mobile-first
L'app è progettata per smartphone. Ogni interazione è ottimizzata per touch e schermi piccoli.

### Semplicità
Massimo 2 tap per le azioni più comuni (aggiungere farmaco, vedere scadenze).

### Feedback immediato
Ogni azione ha feedback visivo (loading, successo, errore). Nessuna azione silenziosa.

## Layout

### Struttura pagina
```
┌─────────────────────┐
│     Header bar      │  Nome armadietto + azioni
├─────────────────────┤
│                     │
│     Contenuto       │  Scroll area principale
│     principale      │
│                     │
├─────────────────────┤
│   Bottom nav bar    │  4 tab: Home, Scan, Armadietti, Settings
└─────────────────────┘
```

### Bottom navigation
- **Home** (Dashboard) — icona casa
- **Scan** — icona fotocamera/barcode
- **Armadietti** — icona griglia/cartella
- **Settings** — icona ingranaggio

### FAB (Floating Action Button)
- Nella Dashboard, FAB "+" per aggiunta rapida
- Posizionato sopra la bottom nav, a destra

## Colori

### Tema chiaro (default)
- **Primary**: verde (#16a34a) — salute, farmacia
- **Destructive**: rosso (#ef4444) — scaduto, attenzione
- **Warning**: ambra — in scadenza
- **Background**: bianco (#ffffff)
- **Text**: quasi nero (#0a0a0a)
- **Card**: bianco (#ffffff)
- **Muted**: grigio chiaro (#f5f5f5)
- **Border**: grigio (#e5e5e5)
- **Accent**: verde chiarissimo (#f0fdf4)

### Tema scuro (Neutral Dark)
- **Primary**: verde (#16a34a) — invariato
- **Destructive**: rosso (#dc2626) — leggermente più scuro per contrasto
- **Background**: nero quasi puro (#0a0a0a)
- **Text**: bianco (#fafafa)
- **Card**: grigio scuro (#171717)
- **Muted**: grigio (#262626)
- **Muted text**: grigio chiaro (#a3a3a3)
- **Border**: grigio (#262626)
- **Accent**: verde scurissimo (#052e16)

### Gestione tema
- Tre modalità: **Sistema** (segue preferenze OS), **Chiaro**, **Scuro**
- Default: Sistema (rileva `prefers-color-scheme` del browser)
- Persistenza: `localStorage` con chiave `farmakit-theme`
- Libreria: `next-themes` con `attribute="class"` (classe `.dark` su `<html>`)
- Meta `theme-color` aggiornata dinamicamente (verde in light, nero in dark)

## Tipografia

- Font di sistema (system-ui) — caricamento rapido, familiare
- Dimensioni minime: 16px per testo body (previene zoom su iOS)
- Titoli: bold, dimensione differenziata

## Componenti chiave

### Card farmaco
```
Forme contabili (compressa, capsula, cerotto…):
┌──────────────────────────────────────┐
│ Tachipirina 500mg       [-] 2 [+]   │
│ ⏳ 15 giu 2026 · Compressa 500mg    │
└──────────────────────────────────────┘

Forme non contabili (sciroppo, crema, gel, spray…):
┌──────────────────────────────────────┐
│ Nurofen Febbre e Dolore              │
│ ⏳ 15 giu 2026 · Sciroppo 100mg/5ml │
└──────────────────────────────────────┘
```
Per le forme non contabili lo stepper quantità è nascosto.
La distinzione è gestita da `isCountableForm()` in `app/src/lib/pharmaceutical-forms.ts`.

### Scanner barcode
- Viewport fotocamera a schermo intero (quasi)
- Overlay con guida rettangolare
- Feedback visivo al riconoscimento (vibrazione + highlight)
- Bottone "Inserisci codice manualmente" sotto

### Form aggiunta
- Ricerca farmaco con autocomplete
- Campi: forma farmaceutica, dosaggio, quantità (stepper ±, solo forme contabili), scadenza (date picker nativo), note
- Bottone salva prominente in basso

## Interazioni

### Swipe
- Swipe sinistra su card farmaco → azioni rapide (modifica, elimina)

### Pull to refresh
- Dashboard supporta pull-to-refresh per sync manuale

### Haptic feedback
- Vibrazione breve su scan riuscito
- Vibrazione su azioni distruttive (conferma eliminazione)

## Accessibilità

- Contrasto minimo WCAG AA
- Label per tutti gli input
- Focus management su navigazione
- aria-label per icone senza testo
- Supporto screen reader per azioni principali

## Offline UX

- Banner superiore quando offline: "Sei offline — le modifiche saranno sincronizzate"
- Badge su icona sync nel header con contatore mutazioni pendenti
- Tutte le operazioni CRUD funzionano offline
- Indicatore visivo dati stale (ultimo sync)
