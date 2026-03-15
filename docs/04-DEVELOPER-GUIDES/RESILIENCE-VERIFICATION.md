# Preverjanje resilience v runtime (Blok B #7)

Circuit breaker in retry obstajata; preverjena vključenost v kritične poti.

## Retry (retryWithBackoff)

**Vir:** [src/workflows/error-handler.ts](../src/workflows/error-handler.ts)

- Max 3 poskusi (privzeto), exponential backoff
- Retry pri: timeout, network, ECONNRESET, ETIMEDOUT, 500/502/503

### Kritične poti z retry

| Pot | Datoteka | Opomba |
|-----|----------|--------|
| Workflow agent execution | WorkflowExecutor.ts | retryWithBackoff za vsak agent run |
| /api/v1/generate | api/v1/generate/route.ts | retryWithBackoff(agent.execute) |
| /api/chat – vector search | api/chat/route.ts | retryWithBackoff(vectorSearch) |
| /api/chat – plan | api/chat/route.ts | retryWithBackoff(plan) |
| /api/health/resilience | - | Runtime preverjanje konfiguracije (ni retry) |

## Circuit breaker

**Vir:** [src/lib/agent-resilience.ts](../src/lib/agent-resilience.ts)

- Uporablja se v `AgentResilienceTester` za testiranje
- Circuit breaker v ai-agent-production-validation je konfiguracija, ne runtime integracija

Za produkcijski runtime bi bil potreben wiring v orchestrator/agent layer (načrtovano).

## Preverjanje

1. **Runtime status:** `GET /api/health/resilience` – vrne konfiguracijo retry in circuit breaker.
2. Zaženi aplikacijo in simuliraj 502/503 od zunanjega providerja (npr. OpenAI).
3. Preveri, da se zahteva ponovi (log/network).
4. Workflow: ustvari workflow z agentom, preveri retry ob napaki.

## Blok B #7 – Verification checklist

- [x] `GET /api/health/resilience` vrača 200 in prikazuje retry/circuit breaker config (unit test + k6 smoke)
- [ ] Chat: simuliraj timeout/502 pri vector search – preveri retry (log ali network) – manual
- [ ] Plan-execute: preveri retry ob agent napaki (WorkflowExecutor) – manual
