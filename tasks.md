# 📋 AgentFlow Pro - Tasks (WBS)

## 🎯 Work Breakdown Structure

---

## PHASE 1: Infrastructure Setup (Day 1-2)

### 1.1 Project Initialization
- [x] 1.1.1 Ustvari project mapo: `C:\Users\admin\projects\fullstack\agentflow-pro`
- [x] 1.1.2 Inicializiraj Git repo: `git init`
- [x] 1.1.3 Kreiraj `.gitignore` (Node, Python, .env)
- [x] 1.1.4 Kreiraj osnovno strukturo map
- [x] 1.1.5 Setup `.cursorrules` za projekt

### 1.2 MCP Konfiguracija
- [x] 1.2.1 Posodobi `mcp.json` z vsemi zahtevanimi serverji
- [x] 1.2.2 Testiraj Memory MCP povezavo
- [x] 1.2.3 Testiraj GitHub MCP povezavo
- [x] 1.2.4 Testiraj Vercel MCP povezavo
- [x] 1.2.5 Konfiguriraj environment variables

### 1.3 Memory Bank Setup
- [x] 1.3.1 Kreiraj `memory-bank/current/` strukturo
- [x] 1.3.2 Inicializiraj `projectbrief.md`
- [x] 1.3.3 Inicializiraj `tasks.md`
- [x] 1.3.4 Inicializiraj `progress.md`
- [x] 1.3.5 Inicializiraj `knowledge-graph.md`

### 1.4 Development Environment
- [x] 1.4.1 Namesti Node.js dependencies
- [x] 1.4.2 Namesti Python dependencies
- [x] 1.4.3 Konfiguriraj PostgreSQL database
- [x] 1.4.4 Setup Prisma schema
- [x] 1.4.5 Testiraj database connection

---

## PHASE 2: Core Agent System (Day 3-5)

### 2.1 Agent Orchestrator
- [x] 2.1.1 Kreiraj `src/orchestrator/` mapo
- [x] 2.1.2 Implementiraj `Orchestrator` class
- [x] 2.1.3 Implementiraj agent registration system
- [x] 2.1.4 Implementiraj task queue system
- [x] 2.1.5 Implementiraj agent communication protocol

### 2.2 Research Agent
- [x] 2.2.1 Kreiraj `src/agents/research/` mapo
- [x] 2.2.2 Implementiraj Firecrawl MCP integration
- [x] 2.2.3 Implementiraj Brave Search MCP integration
- [x] 2.2.4 Kreiraj data extraction pipeline
- [x] 2.2.5 Implementiraj structured output (JSON)
- [x] 2.2.6 Testiraj Research Agent

### 2.3 Content Agent
- [x] 2.3.1 Kreiraj `src/agents/content/` mapo
- [x] 2.3.2 Implementiraj Context7 MCP integration
- [x] 2.3.3 Implementiraj content generation pipeline
- [x] 2.3.4 Implementiraj SEO optimization
- [x] 2.3.5 Kreiraj multi-format output (blog, social, email)
- [x] 2.3.6 Testiraj Content Agent

### 2.4 Code Agent
- [x] 2.4.1 Kreiraj `src/agents/code/` mapo
- [x] 2.4.2 Implementiraj GitHub MCP integration
- [x] 2.4.3 Implementiraj code generation pipeline
- [x] 2.4.4 Implementiraj code review system
- [x] 2.4.5 Implementiraj PR auto-creation
- [x] 2.4.6 Testiraj Code Agent

### 2.5 Deploy Agent
- [x] 2.5.1 Kreiraj `src/agents/deploy/` mapo
- [x] 2.5.2 Implementiraj Vercel MCP integration
- [x] 2.5.3 Implementiraj Netlify MCP integration
- [x] 2.5.4 Implementiraj environment management
- [x] 2.5.5 Implementiraj rollback system
- [x] 2.5.6 Testiraj Deploy Agent

---

## PHASE 3: Knowledge Graph (Day 5-6)

### 3.1 Memory MCP Integration
- [x] 3.1.1 Implementiraj `mcp_memory_create_entities`
- [x] 3.1.2 Implementiraj `mcp_memory_add_observations`
- [x] 3.1.3 Implementiraj `mcp_memory_create_relations`
- [x] 3.1.4 Implementiraj `mcp_memory_search_nodes`
- [x] 3.1.5 Implementiraj `mcp_memory_read_graph`

### 3.2 Knowledge Graph Schema
- [x] 3.2.1 Definiraj Entity types (Agent, Workflow, Task, User)
- [x] 3.2.2 Definiraj Relation types (executes, owns, triggers)
- [x] 3.2.3 Definiraj Observation schema
- [x] 3.2.4 Implementiraj persistence layer
- [x] 3.2.5 Testiraj knowledge graph queries

### 3.3 Cross-Session Memory
- [x] 3.3.1 Implementiraj session management
- [x] 3.3.2 Implementiraj context persistence
- [x] 3.3.3 Implementiraj memory retrieval on session start
- [x] 3.3.4 Testiraj cross-session continuity

---

## PHASE 4: Workflow Builder (Day 7)

### 4.1 Visual Builder
- [x] 4.1.1 Kreiraj `src/web/components/workflow-builder/`
- [x] 4.1.2 Implementiraj drag & drop interface
- [x] 4.1.3 Implementiraj node types (Agent, Condition, Action)
- [x] 4.1.4 Implementiraj connection system
- [x] 4.1.5 Implementiraj workflow validation

### 4.2 Conditional Logic
- [x] 4.2.1 Implementiraj IF/ELSE conditions
- [x] 4.2.2 Implementiraj loop support
- [x] 4.2.3 Implementiraj parallel execution
- [x] 4.2.4 Implementiraj error handling
- [x] 4.2.5 Testiraj complex workflows

### 4.3 API Integrations
- [x] 4.3.1 Kreiraj API endpoint za workflow execution
- [x] 4.3.2 Implementiraj webhook support
- [x] 4.3.3 Implementiraj third-party integrations (Slack, Email)
- [x] 4.3.4 Kreiraj API documentation
- [x] 4.3.5 Testiraj API endpoints

---

## PHASE 5: Monetization (Day 8-9)

### 5.1 Stripe Integration
- [x] 5.1.1 Setup Stripe account + API keys
- [x] 5.1.2 Implementiraj subscription plans
- [x] 5.1.3 Implementiraj payment processing
- [x] 5.1.4 Implementiraj webhook handling
- [x] 5.1.5 Implementiraj usage tracking

### 5.2 User Management
- [x] 5.2.1 Implementiraj user registration
- [x] 5.2.2 Implementiraj authentication (email/password + OAuth)
- [x] 5.2.3 Implementiraj role-based access control
- [x] 5.2.4 Implementiraj team management
- [x] 5.2.5 Testiraj user flows

### 5.3 Usage Limits
- [x] 5.3.1 Implementiraj agent run counter
- [x] 5.3.2 Implementiraj plan-based limits
- [x] 5.3.3 Implementiraj overage handling
- [x] 5.3.4 Implementiraj upgrade flow
- [x] 5.3.5 Testiraj limit enforcement

---

## PHASE 6: Testing (Day 10-11)

### 6.1 Unit Tests
- [x] 6.1.1 Setup Jest testing framework
- [x] 6.1.2 Write tests for orchestrator
- [x] 6.1.3 Write tests for each agent
- [x] 6.1.4 Write tests for memory system
- [x] 6.1.5 Achieve >80% code coverage (296 testov, ~75% – auth-options, auth-users, vector-indexer, QdrantService, WorkflowExecutor, verifier schemas)

### 6.2 E2E Tests (Playwright)
- [x] 6.2.1 Setup Playwright testing framework
- [x] 6.2.2 Write tests for user registration
- [x] 6.2.3 Write tests for workflow creation
- [x] 6.2.4 Write tests for agent execution
- [x] 6.2.5 Write tests for payment flow

### 6.3 Performance Tests
- [x] 6.3.1 Load testing (100 concurrent users) – k6 load.js, docs/LOAD-TEST-K6.md
- [x] 6.3.2 Agent response time testing – load-tests/faq-response.js
- [x] 6.3.3 Memory query performance – docs/load-test-results.md
- [x] 6.3.4 Database query optimization – indexi preverjeni (FaqResponseLog, ChatEscalation)
- [x] 6.3.5 Generate performance report – docs/load-test-results.md

---

## PHASE 7: Deploy Pipeline (Day 12-13)

### 7.1 Vercel Deploy
- [x] 7.1.1 Konfiguriraj Vercel project
- [x] 7.1.2 Setup environment variables
- [x] 7.1.3 Configure build settings
- [x] 7.1.4 Setup preview deployments
- [x] 7.1.5 Test production deployment

### 7.2 Docker Containers
- [x] 7.2.1 Kreiraj `Dockerfile` (app; agent containers odloženi za post-MVP)
- [x] 7.2.2 Kreiraj `docker-compose.yml` (MVP: app, postgres, redis)
- [x] 7.2.3 Setup container networking (agentflow-network)
- [x] 7.2.4 Configure health checks (app, postgres, redis)
- [x] 7.2.5 Test container deployment – `docker-compose up --build`

### 7.3 CI/CD Pipeline
- [x] 7.3.1 Setup GitHub Actions workflow
- [x] 7.3.2 Configure automated testing
- [x] 7.3.3 Configure automated deployment
- [x] 7.3.4 Setup branch protection rules
- [x] 7.3.5 Test CI/CD pipeline

---

## PHASE 8: Monitoring & Launch (Day 14)

### 8.1 Sentry Integration
- [x] 8.1.1 Setup Sentry project
- [x] 8.1.2 Configure error tracking
- [x] 8.1.3 Setup alerting rules
- [x] 8.1.4 Configure performance monitoring
- [x] 8.1.5 Test error reporting

### 8.2 Analytics
- [x] 8.2.1 Setup usage analytics
- [x] 8.2.2 Setup conversion tracking
- [x] 8.2.3 Setup user behavior tracking
- [x] 8.2.4 Create analytics dashboard
- [x] 8.2.5 Test analytics pipeline

### 8.3 MVP Launch
- [x] 8.3.1 Final security audit – SECURITY-AUDIT-CHECKLIST preverjen
- [x] 8.3.2 Documentation review – DOCS-REVIEW-CHECKLIST preverjen
- [x] 8.3.3 Create landing page – src/app/page.tsx, CTA /onboarding
- [x] 8.3.4 Setup support channels – support-channels.md, /contact
- [ ] 8.3.5 **LAUNCH MVP** – po [production-launch-checklist.md](docs/production-launch-checklist.md) (P0, predeploy, redeploy)

---

## Progress Tracking

| Phase | Tasks | Complete | % |
|-------|-------|----------|---|
| Phase 1: Infrastructure | 20 | 20 | 100% |
| Phase 2: Core Agents | 30 | 30 | 100% |
| Phase 3: Knowledge Graph | 15 | 15 | 100% |
| Phase 4: Workflow Builder | 15 | 15 | 100% |
| Phase 5: Monetization | 20 | 20 | 100% |
| Phase 6: Testing | 20 | 19 | 95% |
| Phase 7: Deploy | 20 | 20 | 100% |
| Phase 8: Launch | 15 | 14 | 93% |
| **TOTAL** | **155** | **154** | **99%** |

---

## Priority Matrix

| Priority | Task ID | Description | Impact |
|----------|---------|-------------|--------|
| **P0** | 1.1-1.4 | Infrastructure | Critical |
| **P0** | 2.1-2.5 | Core Agents | Critical |
| **P0** | 3.1-3.3 | Knowledge Graph | Critical |
| **P1** | 4.1-4.3 | Workflow Builder | High |
| **P1** | 5.1-5.3 | Monetization | High |
| **P1** | 6.1-6.3 | Testing | High |
| **P2** | 7.1-7.3 | Deploy | Medium |
| **P2** | 8.1-8.3 | Launch | Medium |

---

## Hotel Core / Tourism – Backlog

| Element | Status |
|---------|--------|
| **TranslationJob** | Implementirano – večjezični rezultati (booking, email) se shranijo v `results` ob save. |
| **PropertySelector v Hotel Core** | Implementirano – izbiralnik nastanitve v formi pred shranjevanjem. |
| **Gumb "Generiraj z Core" na landing strani** | Implementirano – gumb v Korak 2 kliče Core API, prikaže prenosi HTML in Shrani v bazo. |
