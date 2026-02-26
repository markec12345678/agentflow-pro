# 🤖 AgentFlow Pro - Project Brief

## 📌 Projekt Pregled
**Ime:** AgentFlow Pro  
**Tip:** Multi-Agent AI Platform za Business Avtomatizacijo  
**Verzija:** 1.0.0 (MVP)  
**Status:** Development  
**Datum Začetka:** 2026-01-15  

---

## 🎯 Biznis Cilji

### Primary Goals
| Cilj | Metrika | Rok |
|------|---------|-----|
| Launch MVP | 3 aktivni agenti | 7 dni |
| First Paying Customer | 1 Pro subscription | 30 dni |
| MRR Target | $1,000/mesec | 60 dni |
| Scale | $10,000 MRR | 180 dni |

### Target Audience
- **Freelancers** (1-5 oseb) - Starter plan $29/mesec
- **Small Teams** (5-20 oseb) - Pro plan $99/mesec
- **Enterprise** (20+ oseb) - Enterprise plan $499/mesec

---

## 🏗️ Tehnična Arhitektura

### Tech Stack

**FRONTEND**
- Next.js 15 + React 19 + TypeScript
- TailwindCSS + shadcn/ui
- Playwright (E2E testing)

**BACKEND**
- FastAPI (Python) + Node.js (Express)
- PostgreSQL + Prisma ORM
- Redis (caching + queue)

**AI INFRASTRUCTURE**
- Memory MCP (Knowledge Graph)
- Sequential Thinking MCP (Decision Making)
- Custom Agent Orchestrator

**DEPLOY & MONITORING**
- Vercel (Frontend) + Docker (Agents)
- Sentry (Error Tracking)
- GitHub Actions (CI/CD)

### MCP Serverji (Aktivni za Projekt)

| MCP | Namen | Status |
|-----|-------|--------|
| Memory | Knowledge Graph | ✅ Required |
| GitHub | Repo Management | ✅ Required |
| Git | Version Control | ✅ Required |
| Playwright | E2E Testing | ✅ Required |
| Firecrawl | Web Scraping | ✅ Required |
| Context7 | API Documentation | ✅ Required |
| Vercel | Frontend Deploy | ✅ Required |
| Docker | Agent Containers | ✅ Required |
| Sentry | Error Monitoring | ✅ Required |
| Sequential Thinking | Agent Decisions | ✅ Required |
| Brave Search | Web Research | ⚠️ Optional |
| Netlify | Alternative Deploy | ⚠️ Optional |

---

## 🤖 AI Agenti (Core Features)

### 1. Research Agent

| Funkcija | Opis |
|----------|------|
| Web Scraping | Firecrawl MCP za podatke |
| Market Intelligence | Brave Search za trende |
| Competitor Analysis | Avtomatsko poročilo |
| Output | Structured JSON + Memory storage |

### 2. Content Agent

| Funkcija | Opis |
|----------|------|
| Content Generation | LLM + Context7 docs |
| SEO Optimization | Keyword analysis |
| Multi-format | Blog, social, email |
| Output | Publish-ready content |

### 3. Code Agent

| Funkcija | Opis |
|----------|------|
| Code Generation | GitHub MCP integration |
| Code Review | Auto PR creation |
| Bug Detection | Sentry integration |
| Output | Production-ready code |

### 4. Deploy Agent

| Funkcija | Opis |
|----------|------|
| Auto Deploy | Vercel/Netlify MCP |
| Environment Mgmt | Env vars management |
| Rollback | One-click rollback |
| Output | Live deployment |

---

## 💵 Monetizacija

### Pricing Plans

| Plan | Cena | Features | Target |
|------|------|----------|--------|
| **Starter** | $39/mesec | 3 agenti, 100 runs/mesec | Tourism Freelancers |
| **Pro** | $79/mesec | 10 agentov, 1000 runs/mesec | Small Travel Agencies |
| **Enterprise** | $299/mesec | Unlimited agenti, custom | Tourism Companies |
| **API** | $0.005/run | Pay-per-use | Developers |

### Revenue Projections (Tourism Adjusted)

| Mesec | Users | MRR |
|-------|-------|-----|
| 1 | 5 Starter | $195 |
| 3 | 20 Starter + 5 Pro | $855 |
| 6 | 50 Starter + 20 Pro + 2 Enterprise | $4,730 |
| 12 | 200 Starter + 100 Pro + 10 Enterprise | $20,600 |

### Pricing Strategy Rationale

**Starter ($39/mo)**
- Tourism freelancers have higher budgets vs general freelancers
- Competitively positioned vs Jasper Pro ($69/mo)
- Includes specialized tourism agents (Reservation, Communication)

**Pro ($79/mo)**
- Small travel agencies are price-sensitive
- 20% lower than original pricing for volume adoption
- Competitive with Jasper Pro while offering tourism specialization

**Enterprise ($299/mo)**
- Tourism companies need volume discounts for scale
- 40% reduction from original pricing
- Custom features for large tourism operations

**API ($0.005/run)**
- Tourism volume is high with seasonal peaks
- 50% reduction to encourage API adoption
- Ideal for integration partners and OTAs

---

## 📅 Timeline (MVP)

**Week 1: Core Infrastructure**
- Day 1-2: Project setup + MCP config
- Day 3-4: Agent orchestrator
- Day 5-6: Memory knowledge graph
- Day 7: Basic workflow builder

**Week 2: Features + Testing**
- Day 8-9: Stripe integration
- Day 10-11: E2E tests (Playwright)
- Day 12-13: Deploy pipeline
- Day 14: MVP Launch

**Week 3-4: Marketing + Customers**
- Landing page optimization
- First customer outreach
- Feedback iteration

---

## 🔐 Varnost & Compliance

| Zahteva | Implementacija |
|---------|----------------|
| Data Encryption | AES-256 at rest, TLS in transit |
| API Keys | Environment variables only |
| User Data | GDPR compliant |
| Audit Log | All agent actions logged |
| Access Control | Role-based (RBAC) |

---

## 📊 Success Metrics (KPIs)

| Metrika | Target | Measurement |
|---------|--------|-------------|
| Agent Run Success Rate | >95% | Sentry + Logs |
| Average Response Time | <2s | Performance monitoring |
| Customer Satisfaction | >4.5/5 | NPS surveys |
| MRR Growth | 20%/mesec | Stripe analytics |
| Churn Rate | <5%/mesec | Subscription tracking |

---

## 📞 Contact & Resources

| Role | Resource |
|------|----------|
| Project Owner | Admin (lokalno) |
| GitHub Repo | github.com/{username}/agentflow-pro |
| Documentation | agentflow-pro.docs |
| Support | support@agentflow.pro |
| Status Page | status.agentflow.pro |
