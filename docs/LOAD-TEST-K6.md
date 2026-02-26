# Load Testing z k6 (Blok B #5)

Spoznati meje sistema pred beto. AgentFlow Pro uporablja [k6](https://k6.io/) za load teste.

## Zahteve

Namestite k6:

- **Windows ( Chocolatey):** `choco install k6`
- **macOS:** `brew install k6`
- **Linux:** [k6 install guide](https://grafana.com/docs/k6/latest/set-up/install-k6/)

## Skripte

| Skripta | Namen | Prima uporaba |
|---------|-------|---------------|
| `load-tests/smoke.js` | Hitro preverjanje zdravja | Pre-deploy sanity |
| `load-tests/load.js` | Osnovni load (health, homepage) | Spoznavanje meja |
| `load-tests/faq-response.js` | Agent/FAQ response time | Phase 6.3.2 |

## Zagon

```bash
# Smoke – 5 VU, 30 s
k6 run load-tests/smoke.js

# Load – postopno 0→20→50 VU
k6 run load-tests/load.js

# Proti produkciji
k6 run -e BASE_URL=https://your-app.vercel.app load-tests/smoke.js

# Bolj intenzivno
k6 run --vus 100 --duration 2m load-tests/load.js
```

## Rezultati

k6 izpiše povzetek: število zahtev, p95 latenca, napake. Za HTML report:

```bash
k6 run --out json=results.json load-tests/load.js
# ali
k6 run --out html=report.html load-tests/load.js
```

## Kritični endpointi

| Endpoint | Auth | Opomba |
|----------|------|--------|
| `/api/health` | Ne | Primarni target za load |
| `/` | Ne | Homepage |
| `/api/tourism/faq?category=...` | Ne | FAQ listing (smoke + load) |
| `/api/chat` | Da | Za auth load potrebuje session/token |
| `/api/v1/generate` | Bearer | API key v header |

Za load na auth endpointih ustvarite ločeno skripto s predlogom prijave (login → session cookie) in jo dodajte v `load-tests/`.

## Blok B #5 – Preverjanje pred beta

Zagnati proti produkciji (replace `BASE_URL` z dejanskim production URL):

```bash
k6 run -e BASE_URL=https://agentflow-pro-seven.vercel.app load-tests/smoke.js
k6 run -e BASE_URL=https://agentflow-pro-seven.vercel.app --vus 50 --duration 1m load-tests/load.js
```

Rezultati: zabeleži p95 latenca, error rate, throughput. Za HTML report: `k6 run --out html=report.html -e BASE_URL=... load-tests/load.js`

## Phase 6.3 – Load testing (100 concurrent users)

```bash
# Ali: npm run load:100
k6 run --vus 100 --duration 2m -e BASE_URL=https://agentflow-pro-seven.vercel.app load-tests/load.js
k6 run --out html=load-report.html --vus 100 --duration 2m -e BASE_URL=... load-tests/load.js
```

Dokumentiraj v `docs/load-test-results.md`: p95, error rate, throughput.
