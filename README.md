# AgentFlow Pro

Multi-Agent AI Platform za business avtomatizacijo. Zgrajen z 4 AI agenti (Research, Content, Code, Deploy), visual workflow builderjem in Stripe monetizacijo.

**Production:** https://agentflow-pro-seven.vercel.app

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
- [PROJECT-STRUCTURE](docs/PROJECT-STRUCTURE.md) – struktura projekta
- [STRIPE-SETUP](docs/STRIPE-SETUP.md) – Stripe konfiguracija
- [VERCEL-ENV-CHECKLIST](docs/VERCEL-ENV-CHECKLIST.md) – Vercel env vars

---

## Licenca

Private – vse pravice pridržane.
