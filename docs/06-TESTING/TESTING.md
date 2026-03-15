# Finalna Testna Checklista

Ročno testiranje workflow export/import in execution. Za zagon glej [LOCAL-TESTING.md](LOCAL-TESTING.md).

---

## End-to-End Test

```
┌─────────────────────────────────────────────────────────┐
│  END-TO-END TEST                                        │
├─────────────────────────────────────────────────────────┤
│  [ ] 1. Export JSON downloada file                      │
│  [ ] 2. Import JSON vrne node-e pravilno                │
│  [ ] 3. Run Workflow odpre modal                        │
│  [ ] 4. Progress bar se premika                         │
│  [ ] 5. Current agent se prikazuje                      │
│  [ ] 6. Results se prikazujejo                          │
│  [ ] 7. Errors se prikazujejo (če so)                   │
│  [ ] 8. Close button zapre modal                        │
│  [ ] 9. Ni console napak (F12)                          │
│  [ ] 10. Ni server napak (terminal)                     │
└─────────────────────────────────────────────────────────┘
```

---

## E2E testi (Playwright)

Za avtomatsko preverjanje zaženi:

```bash
npm run test:e2e
```

Prekrivajo: Export, Import, Run Workflow, ExecutionProgressModal, Progress bar, Results, Errors, Close, Console/Server checks. Glej `tests/e2e/workflow-export-import.spec.ts` in `tests/e2e/workflow-execution.spec.ts`.
