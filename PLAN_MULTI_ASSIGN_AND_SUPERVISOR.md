# Piano di Sviluppo — Multi-assegnazione + Vista Supervisore

## Stima totale: ~3-4 ore

---

## BLOCCO A — Multi-assegnazione (1.5-2h)

### A1. Aggiornare QuickAdd per selezione multipla utenti (30min)
**File:** `src/components/tasks/QuickAdd.tsx`
- `assignTo` diventa array `assignTo: Profile[]`
- Click su utente lo aggiunge (chip multipli)
- Click su X del chip lo rimuove
- `onAdd` riceve `assignToUserIds: string[]`

### A2. Aggiornare form creazione per selezione multipla (20min)
**File:** `src/app/tasks/new/page.tsx`
- Stessa logica: campo "Assegna a" supporta selezione multipla
- Chip multipli con X individuale

### A3. Aggiornare handleQuickAdd e createTask flow (20min)
**File:** `src/app/page.tsx`, `src/app/tasks/page.tsx`
- Dopo creazione task, ciclo `for` su ogni userId → `assignTask(taskId, userId)`
- Ogni destinatario riceve la sua notifica

### A4. Mostrare co-assegnatari nella TaskCard (20min)
**File:** `src/components/tasks/TaskCard.tsx`, `src/hooks/useTasks.ts`
- Query: JOIN todo_assignments per ogni task
- Nella card: badge "Con: Claudio, Barbara" sotto il titolo
- Solo per task assegnati a me dove ci sono altri assegnatari

### A5. Mostrare tutti gli assegnatari nel dettaglio task (20min)
**File:** `src/app/tasks/[id]/page.tsx`
- Sezione "Assegnato a" con lista:
  - Nome → stato (✓ Accettato / ⏳ In attesa / ✗ Rifiutato)
- Visibile sia per chi ha creato il task sia per i destinatari

### A6. Aggiornare "Assegnati da me" con vista multi (10min)
**File:** `src/app/sent/page.tsx`
- Sotto ogni task mostra tutti i destinatari con il loro stato
- Bottone "Revoca" individuale per ogni assegnatario

---

## BLOCCO B — Vista Supervisore / Direttore Generale (1.5-2h)

### B1. Tabella accesso supervisore (10min)
**Database:** Migration SQL
```sql
CREATE TABLE todo_supervisor_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supervisor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  supervised_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(supervisor_id, supervised_id)
);

-- RLS: il supervisore vede i propri record
-- Giacomo (il tuo account) viene inserito come supervisore di tutti
```

### B2. RLS policy per lettura task altrui (10min)
**Database:** Nuova policy SELECT su todo_tasks
```sql
CREATE POLICY "Supervisors can view supervised users tasks"
ON todo_tasks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM todo_supervisor_access sa
    WHERE sa.supervisor_id = auth.uid()
    AND sa.supervised_id = todo_tasks.created_by
  )
);
```
- Solo SELECT, mai UPDATE/DELETE — il supervisore legge, non modifica

### B3. Pagina Dashboard Supervisore (40min)
**File:** `src/app/supervisor/page.tsx` (nuovo)
- Header: "Dashboard Team"
- Per ogni utente supervisionato, una card con:
  - Nome utente
  - Task totali aperti
  - Task in ritardo (numero + badge rosso se > 0)
  - Task completati questa settimana
  - Distribuzione per ruolo (mini pill colorate)
- Click su una card → drill-down sui task di quell'utente

### B4. Vista dettaglio task utente (30min)
**File:** `src/app/supervisor/[userId]/page.tsx` (nuovo)
- Mostra tutti i task dell'utente selezionato
- Filtri: stato, ruolo, scadenza
- Vista read-only — nessun bottone di modifica
- Badge "Supervisore" nell'header per chiarire il contesto
- Campi visibili: titolo, ruolo, scadenza, stato, priorità, referente, azienda
- Campi NON visibili: note personali (privacy)

### B5. Hook useSupervisor (20min)
**File:** `src/hooks/useSupervisor.ts` (nuovo)
- `fetchSupervisedUsers()` → lista utenti supervisionati con stats
- `fetchUserTasks(userId)` → task di un utente specifico
- Realtime subscription per aggiornamenti live

### B6. Aggiungere alla navigazione (10min)
**File:** `src/components/layout/Sidebar.tsx`
- Voce "Team" con icona Users, visibile SOLO se l'utente ha record in todo_supervisor_access
- Posizione: dopo "Revisione", prima di "Impostazioni"

### B7. Setup iniziale supervisore (5min)
**Database:** INSERT dati
- Giacomo (il tuo account) → supervisore di tutti gli utenti attuali
- Futura pagina admin per gestire chi supervisiona chi (non in questo blocco)

---

## Ordine di esecuzione consigliato

```
B1 → B2 → B7  (DB setup — 25min, prerequisito per tutto il blocco B)
A1 → A2 → A3  (Multi-assign frontend — 1h)
A4 → A5 → A6  (Multi-assign visualizzazione — 50min)
B3 → B4 → B5 → B6  (Supervisor UI — 1h40min)
```

I due blocchi A e B sono indipendenti — posso farli in parallelo o uno alla volta.

---

## Cosa NON fa questa implementazione

- ❌ Il supervisore non può modificare/completare/eliminare task altrui
- ❌ Non c'è una pagina admin per gestire chi supervisiona chi (per ora si fa via DB)
- ❌ Le note personali dei task non sono visibili al supervisore
- ❌ Non c'è export/report (fase futura)

---

*Piano generato: 27 Marzo 2026 — ToDoBox v1.2.0*
