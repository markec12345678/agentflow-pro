# Debugging Checklist

Odpravljanje pogostih težav pri workflow export/import in execution.

---

## Troubleshooting

| Problem | Rešitev |
|--------|---------|
| Export ne dela | Preveri console za napake (F12) |
| Import vrže error | Preveri JSON strukturo (mora imeti `nodes` + `edges`) |
| Run button ne dela | Preveri če je API endpoint dostopen (`/api/workflows/execute`) |
| ExecutionProgress se ne odpre | Preveri state management v `page.tsx` (`executionProgress`, `setExecutionProgress`) |
| Agenti ne vrnejo rezultatov | Preveri če so agenti pravilno importani (orchestrator-factory) |
| API vrže 500 error | Preveri server logs v terminalu |

---

## Relevantna koda

| Komponenta | Datoteka |
|------------|----------|
| Export / Import logika | `src/app/workflows/page.tsx` – `exportWorkflow`, `importWorkflow` |
| Run Workflow, modal state | `src/app/workflows/page.tsx` – `executeWorkflow`, `executionProgress` |
| ExecutionProgressModal | `src/web/components/workflow/ExecutionProgressModal.tsx` |
| Execute API | `src/app/api/workflows/execute/route.ts` |
| Orchestrator, agenti | `src/lib/orchestrator-factory.ts`, `src/workflows/WorkflowExecutor.ts` |

---

## Hitri preverjanji

1. **Console (F12):** Network tab → POST `/api/workflows/execute` → preveri status in response.
2. **JSON struktura:** Export vsebuje `nodes`, `edges`, `metadata`. Import pričakuje enako.
3. **Trigger node:** Workflow mora imeti vsaj en Trigger node, sicer execution vrže "No trigger node found".
