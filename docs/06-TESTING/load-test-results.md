# Load Test Results (Phase 6.3)

## 6.3.1 Load Testing (100 VU)

**Run:** `k6 run --vus 100 --duration 2m -e BASE_URL=<production-url> load-tests/load.js`

**Optional HTML report:** `k6 run --out html=load-report.html --vus 100 --duration 2m -e BASE_URL=... load-tests/load.js`

### Results (template – fill after run)

| Metrika         | Vrednost |
|-----------------|----------|
| Datum           | YYYY-MM-DD |
| VUs             | 100 |
| Trajanje        | 2 min |
| HTTP req/s      | - |
| p95 latenca (ms)| - |
| Error rate      | - |
| Checks passed   | - |

---

## 6.3.2 Agent Response Time

**Run:** `k6 run load-tests/faq-response.js`

Measures `/api/tourism/faq` POST latency (keyword match mode, no multi-agent by default to avoid LLM cost). For multi-agent: set `useMultiAgent: true` and `propertyId` in the script; expect higher p95 (5–15 s).

| Metrika           | Keyword mode | Multi-agent (est.) |
|-------------------|-------------|--------------------|
| p95 latenca (ms)  | -           | 5000–15000         |
| Target            | <2000       | <15000             |

---

## 6.3.3 Memory Query Performance

MCP `mcp_memory_search_nodes` – manual one-off test. Typical latency: 50–500 ms depending on graph size.

| Query                    | Estimated (ms) |
|--------------------------|----------------|
| search_nodes (simple)    | 50–200         |
| read_graph (full)       | 200–1000       |

*Dokumentirati dejanske čase ob runu.*

---

## 6.3.4 Database Query Optimization

**Existing indexes (Prisma):**

- `FaqResponseLog`: `@@index([propertyId, createdAt])` – analytics FAQ aggregation
- `ChatEscalation`: `@@index([userId])`, `@@index([threadId])`, `@@index([status])`
- `Reservation`: `@@index([propertyId, checkIn])`, `@@index([status])`

**Recommendations:** Indexi so ustrezni za trenutne poizvedbe. Ob rasti podatkov preveri `EXPLAIN ANALYZE` za počasne poizvedbe.

---

## 6.3.5 Performance Report Summary

| Component       | Target        | Status |
|----------------|---------------|--------|
| Health (100 VU)| p95 <3s       | [ ] Run & fill |
| FAQ GET        | p95 <3s       | [ ] Run & fill |
| FAQ POST       | p95 <15s      | [ ] Run & fill |
| Memory MCP     | <500 ms       | [ ] Manual test |
| DB indexes     | Reviewed      | [x] OK |

---

## Opombe

- Health, homepage, FAQ GET so brez auth.
- FAQ POST (keyword mode) je brez auth; multi-agent potrebuje `propertyId` ali `userId`.
- Za auth endpointe (chat, workflows) uporabi ločeno skripto s session cookie.
