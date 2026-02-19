# AgentFlow Pro

AI Content Platform for Tourism & Hospitality. Generate destination guides, hotel copy, and travel campaigns with multi-agent AI. Built for hotels, DMOs, and tour operators.

**Production:** https://agentflow-pro-seven.vercel.app

---

## Tourism Hub

AI za turizem in gostinstvo – vodiči destinacij, hotelni tekst, kampanje, večjezični prevodi. Namenjeno hotelom, DMO in turističnim agencijam.

**Funkcije:**
- **Content Generator** – Booking.com, Airbnb, Vodič, Sezonska kampanja, Instagram (prompti + spremenljivke)
- **Email Workflow** – Welcome, Follow-up, Sezonska emaili za goste
- **Landing Page** – Generator z predlogami (Standard, Luksuz, Družinski)
- **Multi-Language** – Batch prevod v SL, EN, DE, IT, HR
- **SEO Dashboard** – sledenje ključnim besedam, Optimiziraj z AI

→ [Uporabniški vodič](docs/TOURISM-USER-GUIDE.md) · [API dokumentacija](docs/TOURISM-API.md) · [Lokalno testiranje](docs/TOURISM-LOCAL-TESTING.md)

---

## Features

### Knowledge Graph & Memory MCP
- Entity tracking (Agents, Workflows, Users, Tasks)
- Relation mapping (executes, owns, triggers)
- Observation logging
- Cross-session persistence

### Visual Workflow Builder
- React Flow drag & drop editor
- Node types: Agent, Condition, Action, Trigger
- Conditional logic (IF/ELSE, loops)
- Parallel execution
- Workflow validation

### Stripe Monetization
- 3 pricing plans ($29 / $99 / $499)
- Checkout sessions
- Webhook handling
- Subscription management
- Usage tracking & limits

### Content Pipeline & App Library
- Content Pipeline (Kanban) – Draft → Review → Published with bulk actions
- App Library – Ready-made workflow templates (Content Pipeline, Research Brief, Full Stack, Conditional)
- GEO/AEO in Optimize modal – Generative Engine and Answer Engine optimization

### Chrome Extension
- Manifest v3 extension in `extensions/chrome`
- Select text on any page, generate content via AgentFlow Pro API
- See `extensions/chrome/README.md` for setup

### Testing
- 58 unit tests (100% passing)
- E2E tests (Playwright)
- Production test scripts
- CI/CD integration

---

## DevOps

- **GitHub Actions** CI/CD (lint, test, build)
- **Vercel** production deploy
- **Sentry** error tracking
- **Google Analytics**
- Automated testing

---

## Metrike projekta

| Metrika | Vrednost |
|---------|----------|
| Skupaj Tasks | 155 |
| Končani Tasks | 155/155 (100%) |
| Testi | 58/58 passing (100%) |
| MCP Serverji | 16/16 aktivnih |
| AI Agenti | 4/4 complete |
| Faze | 8/8 complete |
| Čas razvoja | ~24 ur (namesto 7 dni) |
| Code Files | 100+ datotek |
| Documentation | 15+ docs |

---

## Quick Start

```bash
git clone https://github.com/markec12345678/agentflow-pro.git
cd agentflow-pro
npm install
cp .env.example .env.local
# Fill in .env.local (see .env.example)
npm run dev
```

Open http://localhost:3000

---

## Dokumentacija

- [LOCAL-TESTING](docs/LOCAL-TESTING.md) – kako testirati lokalno
- [CONTRIBUTING](docs/CONTRIBUTING.md) – development setup
- [DEPLOYMENT](docs/DEPLOYMENT.md) – deployment guide
- [GO-LIVE](docs/GO-LIVE.md) – hitri pregled launch korakov
- [PRODUCTION-LAUNCH-CHECKLIST](docs/production-launch-checklist.md) – production konfiguracija
- [PROJECT-STRUCTURE](docs/PROJECT-STRUCTURE.md) – struktura projekta
- [STRIPE-SETUP](docs/STRIPE-SETUP.md) – Stripe konfiguracija
- [VERCEL-ENV-CHECKLIST](docs/VERCEL-ENV-CHECKLIST.md) – Vercel env vars
- [SUPPORT-CHANNELS](docs/support-channels.md) – support kontakt
- [JASPER-GAP-ANALYSIS](docs/JASPER-GAP-ANALYSIS.md) – primerjava z Jasper, gap analiza

---

## Licenca

Private – vse pravice pridržane.
