# Raziskava: Arhitekturna zasnova - Analiza in primerjava z implementacijo

**Datum:** 17. marec 2026  
**Avtor:** AgentFlow Pro AI Agent  
**Vir:** Uporabnikova raziskava "Arhitekturna zasnova in razvojni načrt za AgentFlow-Pro"

---

## 📋 Povzetek

Vaša raziskava opisuje **napredni agentični sistem** s poudarkom na:
- LangGraph, AutoGen, CrewAI ogrodjih
- 4-modulni arhitekturi (Planner, Executor, Verifier, Generator)
- Model Context Protocol (MCP) za runtime integracijo
- Akademskih inovacijah iz raziskav

**Trenutna implementacija AgentFlow Pro** ima:
- ✅ 4 domenskih agentov (Research, Content, Code, Deploy)
- ✅ Lasten orchestrator (brez LangGraph)
- ✅ Verifier Service (validacija outputov)
- ✅ HITL (Human-in-the-Loop) z confidence estimation
- ✅ React Flow workflow builder
- ✅ MCP za development (Cursor), ne za runtime
- ❌ Brez Planner modula (dynamically razčlenjevanje)
- ❌ Brez Flow-GRPO / RL optimizacije
- ❌ Brez Qdrant/Neo4j (uporablja InMemoryBackend)

---

## 🔍 Detajlna primerjava

### 1. Arhitektura agentov

| Komponenta | Raziskava (Ideal) | AgentFlow Pro (Realnost) | Status |
|------------|-------------------|--------------------------|--------|
| **Planner** | Razčleni query v sub-goals, dinamično prilagajanje | ❌ Ni implementirano | **Gap** |
| **Executor** | Uporaba orodij, API-jev, izvedba | ✅ Orchestrator + 8 agentov (Research, Content, Code, Deploy, Personalization, Image, Reservation, Communication) | ✅ Implementirano |
| **Verifier** | Kontrola kakovosti, "verified reward", re-planning | ✅ VerifierService z validacijo shem (research, content, code, deploy) | ✅ Implementirano |
| **Generator** | Sintetiziranje končnega odgovora | ⚠️ Delno (Content Agent + chat API, brez ločenega modula) | **Delno** |

**Zaključek:** AgentFlow Pro ima **Executor + Verifier**, manjka **Planner** in ločen **Generator**.

---

### 2. Framework primerjava

| Framework | Raziskava predlaga | AgentFlow Pro uporablja | Komentar |
|-----------|-------------------|-------------------------|----------|
| **LangGraph** | ✅ Stateful multi-actor graphs | ❌ Ne uporablja | Lasten orchestrator je enostavnejši |
| **AutoGen** | ✅ Multi-agent conversation | ❌ Ne uporablja | Ni potrebe za kompleksne dialoge |
| **CrewAI** | ✅ Role-based agents | ❌ Ne uporablja | Domenski agenti so dovolj |
| **Model Context Protocol (MCP)** | ✅ Runtime integracija | ⚠️ Samo za development (Cursor) | **Razlika:** MCP ni v runtime API-ju |
| **React Flow** | ✅ Workflow builder | ✅ @xyflow/react | ✅ Popolna ujemanja |

**Priporočilo:** Raziskava naj jasno označi MCP kot **development orodje**, ne runtime komponento.

---

### 3. Memory in Knowledge Management

| Komponenta | Raziskava | AgentFlow Pro | Gap |
|------------|-----------|---------------|-----|
| **Vector DB** | Qdrant | ❌ Ni | **Velik gap** |
| **Graph DB** | Neo4j | ❌ InMemoryBackend | **Velik gap** |
| **Caching** | Redis | ⚠️ Omenjen v project-brief, ni implementacije | **Gap** |
| **Multi-turn memory** | Evolving context | ⚠️ Memory MCP (zunaj app) | **Delno** |
| **Knowledge Graph** | Entity, Relation modeli | ✅ Prisma modeli (Agent, Workflow, Task, User, Deploy) | ✅ Implementirano |

**Kritično:** Za semantic search in RAG (npr. policy vprašanja) bi potrebovali **Qdrant** ali podoben vector store.

---

### 4. Human-in-the-Loop (HITL)

| Funkcija | Raziskava | AgentFlow Pro | Status |
|----------|-----------|---------------|--------|
| **Confidence estimation** | ✅ ML-based | ✅ Heuristic (UNCERTAINTY_PHRASES, SENSITIVE_TOPICS) | ✅ Implementirano |
| **Checkpoint ID** | ✅ `checkpoint_id` za rekonstrukcijo | ❌ Ni | **Gap** |
| **Approval workflow** | ✅ Pred izvedbo | ⚠️ Content Pipeline (Draft → Review → Published) | **Delno** |
| **Escalation dashboard** | ✅ | ✅ `/dashboard/escalations` | ✅ Implementirano |
| **Slack/Email notifications** | ✅ | ✅ Slack/Email webhooks | ✅ Implementirano |

**Zaključek:** HITL je **dobro implementiran** za MVP, manjka checkpointing za napredne use case.

---

### 5. Workflow orkestracija

| Funkcija | Raziskava | AgentFlow Pro | Komentar |
|----------|-----------|---------------|----------|
| **Node tipi** | Planner, Executor, Verifier, Generator | Trigger, Agent, Condition, Action | **Drugačna filozofija** |
| **Conditional branching** | ✅ | ✅ IF/ELSE v Condition node | ✅ |
| **Paralelno izvajanje** | ✅ Multi-agent | ⚠️ Sekvenčno (max 3 concurrent) | **Omejitev** |
| **Dynamic re-planning** | ✅ | ❌ Ni | **Gap** |

**Priporočilo:** Za kompleksnejše flow-je razmisliti o **LangGraph migraciji**.

---

### 6. Monetizacija

| Model | Raziskava | AgentFlow Pro | Razlika |
|-------|-----------|---------------|---------|
| **Pricing tiers** | 4 nivoji (Free, Pro, Team, Enterprise) | 3 nivoji (Starter $29, Pro $99, Enterprise $499) | Enostavneje |
| **Billing** | Credits per workflow run (3-4 credits/run) | `agentRuns` na mesec (100/500/5000) | **Drugačen model** |
| **Enterprise** | Unlimited | 5000 agent runs | Omejitev |

**Predlog:** Raziskava naj omeni obstoječi model, ne benchmarkov iz literature.

---

## 🎯 Identificirani Gap-i

### Kritični (blokirajo proizvodnjo)

1. **❌ Planner modul**
   - Trenutno: Workflow zahteva vnaprej definiran graph
   - Potrebno: LLM-based razčlenjevanje query-ja v sub-goals
   - Vpliv: Omejena fleksibilnost za kompleksne zahteve

2. **❌ Vector search (Qdrant)**
   - Trenutno: In-memory backend
   - Potrebno: Semantic search za policy dokumente, FAQ
   - Vpliv: Omejen RAG za guest communication

3. **❌ Redis caching**
   - Trenutno: Ni cachinga
   - Potrebno: Session caching, rate limiting
   - Vpliv: Performance pri visoki obremenitvi

### Srednji (izboljšajo UX)

4. **⚠️ Generator modul**
   - Trenutno: Content Agent sintetizira odgovore
   - Potrebno: Ločen modul za finalno formatiranje
   - Vpliv: Boljša konsistentnost outputov

5. **⚠️ Workflow credits**
   - Trenutno: `agentRuns` na mesec
   - Predlog: Credits per run (bolj prilagodljivo)
   - Vpliv: Boljša monetizacija

6. **⚠️ Checkpointing**
   - Trenutno: Ni `checkpoint_id`
   - Potrebno: Za HITL rekonstrukcijo
   - Vpliv: Boljši HITL workflows

### Dolgoročni (vision)

7. **🔮 Flow-GRPO / RL optimizacija**
   - Raziskava: 14.9% boljši rezultati
   - Realnost: Zahteva trajektorije, infrastrukturo
   - ROI: Vprašljiv za trenutno domeno

8. **🔮 MCP runtime**
   - Raziskava: MCP za external AI agente
   - Realnost: MCP samo za development
   - Vision: External AI kličejo hotel data

---

## 📊 Prioritetni roadmap

### Faza 1: Nujno (1-2 tedna)

| # | Task | Vir | Vpliv |
|---|------|-----|-------|
| 1 | **Popravek dokumentacije** | Raziskava | Jasna meja implementirano/načrtovano |
| 2 | **Dokumentirati HITL flow** | `hitl.ts` + chat route | Transparentnost |
| 3 | **Zmanjšati "exaggerated claims"** | FEATURES.md | Verodostojnost |

### Faza 2: Srednjoročno (2-4 tedne)

| # | Task | Vir | Vpliv |
|---|------|-----|-------|
| 4 | **Qdrant integracija** | Raziskava | RAG za guest communication |
| 5 | **Redis caching** | Project-brief | Performance |
| 6 | **Planner MVP** | Raziskava | Dinamično razčlenjevanje |
| 7 | **Guest multi-agent flow** | Raziskava | Retrieval → Policy → Copy |

### Faza 3: Dolgoročno (1-3 mesece)

| # | Task | Vir | Vpliv |
|---|------|-----|-------|
| 8 | **Workflow credits sistem** | Raziskava | Boljša monetizacija |
| 9 | **Checkpointing za HITL** | Raziskava | Napredni HITL use case-i |
| 10 | **LangGraph migracija** | Raziskava | Kompleksnejši workflow-i |
| 11 | **PMS/CRM integracija** | Raziskava | Produkcija |

### Faza 4: Vision (3-6+ mesecev)

| # | Task | Vir | Vpliv |
|---|------|-----|-------|
| 12 | **MCP runtime server** | Raziskava | External AI integracije |
| 13 | **Flow-GRPO (RL)** | Raziskava | 14.9% boljši rezultati |
| 14 | **Hybrid pricing** | Raziskava | Fleksibilnejši billing |

---

## 🏗 Arhitekturna priporočila

### 1. Ohraniti trenutno arhitekturo

**Zakaj:**
- 4 domenski agenti so **dovolj** za turizem domeno
- Lasten orchestrator je **enostavnejši** za debug
- Verifier Service **deluje** za validacijo
- HITL z confidence estimation je **produkcijsko pripravljen**

### 2. Dodati Planner modul (nizka prioriteta)

**Implementacija:**
```typescript
interface PlannerService {
  decompose(query: string): Promise<SubGoal[]>;
  adaptPlan(currentPlan: SubGoal[], feedback: unknown): Promise<SubGoal[]>;
}
```

**Uporaba:** Samo za kompleksne query-je (>3 korake).

### 3. Qdrant za vector search (srednja prioriteta)

**Use case:**
- Guest vprašanja: "Ali imate early check-in?"
- Policy search: "Kakšna je cancellation policy?"
- RAG: Semantic search nad dokumenti

**Implementacija:**
- `src/infrastructure/vector/qdrant-client.ts`
- Indexiranje: Policy, FAQ, Property descriptions
- Search: `qdrant.search({ query, limit: 5 })`

### 4. Redis caching (srednja prioriteta)

**Use case:**
- Session caching (user templates)
- Rate limiting (API calls)
- Workflow state caching

**Implementacija:**
- `src/infrastructure/cache/redis-client.ts`
- TTL: 15 min za sesije, 1 uro za workflow state

---

## 📝 Priporočila za raziskavo

### 1. Jasno označiti status

| Trditev | Status | Opomba |
|---------|--------|--------|
| MCP runtime | 🔮 Vision | MCP je za development (Cursor) |
| Storytelling vs Structured Agent | ✅ Implementirano | En Content Agent z različnimi prompti |
| Three-agent guest communication | ⚠️ Delno | Policy/Retrieval/Copy v FAQ flow |
| RevPAR, +18%, +25% | 📊 Benchmark | Industrijski standardi, ne naši podatki |
| Data cleaning tools | ✅ Implementirano | Endpoint + UI v dashboardu |
| Hotel MCP server | 🔮 Vision | Long-term direction |
| Formula $R_e$ | 📊 Konceptualno | Ni izmerjena vrednost |

### 2. Popraviti terminologijo

**Namesto:**
- "Storytelling Agent" in "Structured Agent"

**Uporabiti:**
- "Content Agent z platform-specific prompti (Airbnb/Booking.com)"

**Namesto:**
- "MCP runtime integracija"

**Uporabiti:**
- "MCP za development (Cursor), REST API za runtime"

### 3. Dodati realne metrike

**Trenutno:** Raziskava omenja RevPAR, konverzije brez podatkov.

**Predlog:**
- Dodati placeholder za **prihodnje metrike**
- Jasno označiti **industry benchmarks** vs. **actual data**

---

## 🎯 Zaključek

### Kaj raziskava pravilno identificira:

✅ **Multi-agent orkestracija** je prava smer  
✅ **HITL** je kritičen za production  
✅ **Verifier** izboljša kakovost outputov  
✅ **Knowledge Graph** omogoča semantic search  
✅ **GEO optimization** je pomemben za AI search engine  

### Kje se razlikuje od implementacije:

❌ **LangGraph/AutoGen/CrewAI** niso potrebni za MVP  
❌ **MCP runtime** ni prioriteta (development MCP zadostuje)  
❌ **Flow-GRPO/RL** je preveč kompleksen za trenutno domeno  
❌ **4-modulna arhitektura** je overkill za turizem use case  

### Prioritete:

1. **Faza 1 (takoj):** Popravek dokumentacije, jasna meja implementirano/načrtovano
2. **Faza 2 (2-4 tedne):** Qdrant, Redis, Planner MVP
3. **Faza 3 (1-3 mesece):** Workflow credits, checkpointing, LangGraph
4. **Faza 4 (vision):** MCP runtime, Flow-GRPO

---

## 📞 Naslednji koraki

1. **Prebrati:** `docs/RESEARCH-VS-IMPLEMENTATION-ROADMAP.md` za detajlno analizo
2. **Posodobiti:** Raziskava z označenim statusom (✅/⚠️/❌/🔮)
3. **Odločiti:** Ali želite investirati v Planner/Qdrant/Redis (Faza 2)
4. **Vprašati:** Ali potrebujete pomoč pri implementaciji katere komponente?

---

**Opomba:** Ta analiza temelji na:
- Vaši raziskavi "Arhitekturna zasnova"
- `docs/RESEARCH-VS-IMPLEMENTATION-ROADMAP.md`
- `docs/AGENTFLOW-ECOSYSTEM-COMPARISON.md`
- Dejanski kodi (src/agents/, src/orchestrator/, src/verifier/)
