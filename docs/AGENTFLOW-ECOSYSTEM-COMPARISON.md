# The Technical and Strategic Evolution of Agentic Workflows: Primerjava z AgentFlow Pro

Analiza primerjave raziskave "The Technical and Strategic Evolution of Agentic Workflows: A Comprehensive Analysis of the AgentFlow Pro Ecosystem" z dejansko implementacijo AgentFlow Pro platforme. Dokument namenjen nadaljnjemu strateškemu načrtovanju.

---

## 1. Povzetek

| Aspekt | Raziskava | AgentFlow Pro |
|--------|-----------|---------------|
| **Orientacija** | Splošen, akademsko-usmerjen agentični framework z RL optimizacijo | Praktična SaaS platforma za turizem in content avtomatizacijo |
| **Arhitektura** | 4-modulni model (Planner, Executor, Verifier, Generator) | 4 domenska agenta (Research, Content, Code, Deploy) |
| **Domena** | Enterprise automation, RTL verification, MDM | Tourism & hospitality (hoteli, DMO, vodiči) |

---

## 2. Arhitektura agentov

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| **Planner** – razčlenjevanje v sub-goals, dinamično prilagajanje | Ni – orchestator upravlja flow, ne razčlenjuje |
| **Executor** – orodja, API-ji, izvedba | Research, Content, Code, Deploy – vsak z določenimi orodji (Firecrawl, Context7, GitHub, Vercel) |
| **Verifier** – kontrola kakovosti, "verified reward", re-planning | Ni – samo `wrapWithErrorHandler`, brez validacije rezultatov |
| **Generator** – sintetiziranje odgovora | Delno: Content Agent, chat API – brez ločenega Generator modula |

**Zaključek:** Raziskava uporablja 4-modulni model (Planner / Executor / Verifier / Generator). AgentFlow Pro ima 4 domenska agenta (Research, Content, Code, Deploy) brez Planner/Verifier/Generator ločitev.

---

## 3. Flow-GRPO in RL optimizacija

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| Flow-GRPO – group refined policy optimization | Ni |
| 14.9% boljši rezultati v search-intensive | — |
| 14.0% v agentic reasoning | — |
| SFT trajectories, KL penalty | — |

**Zaključek:** Ni RL optimizacije. Agenti delujejo z LLM API klici (npr. OpenAI) in MCP, brez policy training.

---

## 4. Workflow orkestracija

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| **LangGraph** – stateful, multi-actor graphs | Ni LangGraph – lastni executor |
| **React Flow** | Da – `@xyflow/react` za vizualni builder |
| Node tipi: Planner, Executor, Verifier, Generator | Trigger, Agent, Condition, Action |
| Multi-agent paralelno | Ni – sekvenčna izvedba po queue (max 3 concurrent) |
| Conditional branching | Da – `Condition` node z IF/ELSE |

Implementacija: `src/workflows/executor.ts`, `src/orchestrator/Orchestrator.ts`.

---

## 5. Memory in knowledge management

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| **Qdrant** (vector DB) | Ni |
| **Neo4j** (graph DB) | Ni – GraphManager uporablja InMemoryBackend |
| **Redis** caching | Naveden v `project-brief`, ni konkretna implementacija |
| Multi-turn memory, evolving context | Delno – Memory MCP za sesije, InMemoryBackend v app |

`src/memory/app-backend.ts` – `InMemoryBackend` singleton, brez Qdrant/Neo4j/Redis. MCP Memory je na voljo zunaj aplikacije.

---

## 6. Infrastruktura in tech stack

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| Next.js 14, App Router | Next.js 15, App Router |
| Supabase (PostgreSQL + Auth) | Prisma + PostgreSQL (Supabase kot hosting), **NextAuth** |
| RLS za multi-tenancy | Ni RLS – izolacija prek `userId` |
| Docker | Načrtovan v project-brief, ne v glavnem produktivnem flow |
| Prisma | Da |

---

## 7. Monetizacija in billing

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| 4 nivoji (Free, Pro, Team, Enterprise) | 3 nivoji: Starter $29, Pro $99, Enterprise $499 |
| Credits po workflow run (npr. 3–4 credits/run) | `agentRuns` na mesec (100 / 500 / 5000) |
| Unlimited za Enterprise | 5000 agent runs za Enterprise |

`src/stripe/plans.ts`, `src/api/usage.ts` – štetje `AgentRun` vrstic, brez kreditov na run.

---

## 8. Human-in-the-Loop (HITL)

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| `checkpoint_id` za rekonstrukcijo | Ni checkpoint_id |
| Odobritev pred izvedbo | Content Pipeline (Draft → Review → Published) – podobno HITL |
| Approval workflow | `approvalStatus`, `approvedBy` na BlogPost |

---

## 9. Organizacije in multi-tenancy

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| Organizations, Owner/Admin/Guest | **Teams** – `Team`, `TeamMember` v Prisma |
| Group-based access control | Delno prek team članstva |
| RLS v DB | Ni |

---

## 10. Domena in use case

| Raziskava | AgentFlow Pro |
|-----------|---------------|
| Pro-V Flow (RTL verification) | Ni |
| Reltio MDM (Master Data) | Ni |
| Splošni enterprise automation | **Turizem** – hoteli, DMO, vodiči, email, landing strani, SEO |
| AgentFlow Pro Core (Python) | Da – booking, email, landing, SEO generiranje za hotele |

---

## 11. Strategki predlogi

### Kratkoročno (0–3 mesece)

1. **Verifier modul** – Dodati validacijo po vsakem agentovem koraku (npr. format, obveznost vseh polj) pred naslednjim korakom.
2. **Workflow credits** – Uvesti kreditni sistem (npr. 3–4 credits/run) namesto ali poleg `agentRuns`, bolj prilagojen benchmarku iz raziskave.
3. **Redis** – Če je že v project-brief, dodati caching za konverzacije in sesije.
4. **LangGraph (ali ekvivalent)** – Razmisliti o migraciji na LangGraph za bolj kompleksne, večagentne workflow-je.

### Srednjoročno (3–6 mesecev)

5. **Vector search** – Vključitev Qdrant (ali podobnega) za semantic search nad dokumenti (policy, vodiči).
6. **Planner modul** – LLM modul, ki query razčleni v sub-goals in jih predá executorju.
7. **RLS za Teams** – Row-level security v PostgreSQL za čiste meje med teami v multi-tenant setupu.
8. **Conversation branching** – Veje razgovorov za "what-if" scenarije.

### Dolgoročno (6+ mesecev)

9. **Flow-GRPO ali podoben RL** – Samo če imate dostop do trajektorij in infrastructure za RL training (zahtevno).
10. **Pro-V / Reltio-style moduli** – Če vstopate v hardverski verification ali MDM, dodati specializirane agent module.
11. **Shared workspaces** – Sodelovanje več agentov in uporabnikov v istem "content supply chain".

---

## 12. Sklep

Raziskava opisuje napredni, generični agentični framework z RL optimizacijo in večmodulno arhitekturo. AgentFlow Pro je praktična turistična/content platforma z domenskimi agenti, vizualnim workflow builderjem in Stripe monetizacijo.

**Strategija:** Raziskavo uporabiti kot ciljni referenčni model (Planner, Verifier, LangGraph, credits, vector/graph storage), implementacijo pa graditi postopno: najprej Verifier in credits, nato bolj napredno orchestacijo (LangGraph), nazadnje pa memory in RL, če bo ROI očiten.

---

*Dokument ustvarjen: Februar 2026. Za nadaljnje delo glej tasks.md in memory-bank/current/.*
