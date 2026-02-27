# Progress - AgentFlow Pro

## Progress Update – 2026-02-21

## Completed (2026-02-27) – Receptor Finance + Nova rezervacija

**Receptor Finance Pricing MVP (Faza 1–2):**
- [x] Prisma: deposit, touristTax (Reservation); Payment model; seasonRates (Property)
- [x] API: payments, daily-revenue, invoice; calendar POST/PATCH z deposit/touristTax
- [x] Overbooking: allowOverbooking v calendar API
- [x] Widget dnevni promet na Tourism page
- [x] UI plačila v koledarju (modal, stanje, Dodaj plačilo, Izpiši račun)
- [x] pricing-engine: getSeasonRate, seasonRates v calculatePrice
- [x] UI sezonske cene na Property (visoka/srednja/nizka sezona)

**Nova rezervacija + overbooking UI:**
- [x] Modal Nova rezervacija (forma, Izračunaj ceno, Ustvari)
- [x] Overbooking dialog ob 409 (Prekrivanje... Ustvari vseeno)
- [x] Calendar POST shrani deposit in touristTax

**E2E:**
- [x] calendar-reservation.spec.ts: Nova rezervacija happy path, Overbooking flow

## Completed (Phase 3 – Advanced)
- [x] Phase 3.1: HITL s checkpoint_id – WorkflowCheckpoint, approval API, dashboard widget, requiresApproval v workflow editor
- [x] Phase 3.2: Conversation branching – ConversationThread (parentThreadId), Create branch v chat, /chat/threads
- [x] Phase 3.3: Shared workspaces – Workspace model, API, Canvas+Teams integracija
- [x] Planner integracija v chat – Multi-agent plan checkbox, plan→execute→synthesize flow

## Previously Completed
- [x] Phase 2.2–2.5: Agents, Phase 3–8: Knowledge Graph, Workflow Builder, Stripe, E2E, CI/CD, deploy prep

## Completed (2026-02-26) – MVP Launch 8.3.5 prep

**Tehnična priprava (opravljeno):**
- [x] predeploy.js: `test:e2e:smoke` (usklajeno z production-launch-checklist)
- [x] production-launch-checklist.md: production URL, navodila za predeploy
- [x] LAUNCH-RUNBOOK.md: urejen vodnik po korakih
- [x] Smoke testi: posodobljeni za trenutni UI (Homepage, Dashboard, Pricing, Phase E auth)
- [x] tasks.md: 8.3.5 povezava na checklist
- [x] vercel.json: buildCommand za avtomatske migracije ob deployu

**Ročni P0 koraki (na uporabniku):**
- [ ] Production DB (Supabase/Neon), Stripe live keys, webhook, Vercel env
- [ ] Zaženi `npm run predeploy`, redeploy, ročni test flow (Register → Subscribe → Generate)

## Next Steps
- [ ] MOCK_MODE="false" + API keys za prave agente (če želiš)

## Completed (2026-02-25) – 6.1.5 Coverage boost
- [x] auth-options.test.ts – 16 testov (providers, authorize, jwt, session callbacks)
- [x] auth-users.test.ts – 12 testov (getUserId, registerUser, getUser)
- [x] vector-indexer.test.ts – 9 testov (indexOnboarding, indexUserTemplate, indexBlogPost)
- [x] QdrantService.test.ts – mock Qdrant + fetch za ensureCollection, indexDocuments, search
- [x] WorkflowExecutor – dodatni testi: Condition, Action, error path, startFromNodeId
- [x] verifier/schemas.test.ts – validateResearchOutput, validateContentOutput, validateCodeOutput, validateDeployOutput
- [x] tasks.md: 6.1.5 označen, 154/155 (99%), 296 testov, ~75% coverage (iz ~66%)

## Completed (2026-02-25) – Test fixes + roadmap

- [x] Fix getLlmApiKey mock v batch-translate, generate-content, generate-email, generate-landing testih
- [x] Fix isMockMode v mock-mode mocku (routes kličejo isMockMode(), ne mockMode)
- [x] Fix batch-translate route: mockMode → isMockMode()
- [x] Fix orchestrator test: pričakovan status "completed" (processQueue teče takoj)
- [x] Vsi Jest testi pass (229). Dodani: Orchestrator (failed, not registered), validator, is-admin, data/workflow-apps, solutions, case-studies. Coverage ~68%.
- [x] tasks.md: 8.3.1–8.3.4 označeni

## Completed (2026-02-25) – Roadmap implementation (plan)

- [x] Phase 7.2 Docker: next.config output: standalone, prisma/init.sql, poenostavljen docker-compose (app, postgres, redis)
- [x] Phase 8.3.1–8.3.4: Security, docs, landing, support checklists posodobljeni
- [x] Phase 6.3: load-test-results.md razširjen, faq-response.js, LOAD-TEST-K6.md
- [x] tasks.md: 7.2, 6.3, 8.3.1–8.3.4 označeni (154/155, 99 %)
- [x] tests/lib/tourism/policy-agent.test.ts – 7 unit testov

## Completed (2026-02-25) – Plan implementacija
- [x] Popravek chat route import (requiresEscalationForType, estimateConfidence)
- [x] Staff escalations dashboard: /dashboard/escalations, PATCH API, refetch ob stream
- [x] Slack/Email webhooks za HITL escalation obvestila (SLACK_ESCALATION_WEBHOOK_URL, ESCALATION_NOTIFY_EMAIL)
- [x] MOCK_MODE + API keys dokumentacija
- [x] API dokumentacija: OpenAPI za /api/chat, /api/chat/escalations

## Completed (2026-02-25) – Roadmap nadaljevanje
- [x] Sinhronizacija tasks.md: Phase 5–8 checkboxes (144/155, 93 %)
- [x] Blok A #3: Popravek dokumentacije (HITL v RAZISKAVA tabelo, pojasnilo ai-agent vs hitl)
- [x] RAZISKAVA A #2: Terminologija – FEATURES.md (platform-specific templates), UI "predloge"
- [x] Blok B: Stripe Live, k6, hreflang, Resilience – verification checklists v docs
- [x] Phase 6.3: load-test-results.md, 100 VU navodila v LOAD-TEST-K6
- [x] Phase 8.3: production-launch-checklist razširjen z 8.3.1–8.3.5

## Recently Completed
- [x] RLS v praksi – withRlsContext v canvas API; migracija za userId v policy
- [x] Qdrant indeksiranje – lib/vector-indexer.ts; auto-index ob Onboarding, UserTemplate, BlogPost
- [x] RAG v chat – semantic search nad indeksiranimi dokumenti; kontekst v system prompt

## Metrics
- Tasks Complete: 154/155 (99%)
- Days Elapsed: 1/14
- Tests Passing: 58/58 (100%)
- MCP Servers Used: 14/16
- Agents Complete: 4/4 (100%)
- Knowledge Graph: ✅ Complete
- Workflow Builder: ✅ Complete
- Monetization: ✅ Complete
- E2E Testing: ✅ Complete
