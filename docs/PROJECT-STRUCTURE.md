# AgentFlow Pro – Struktura projekta

Pregled direktorijev in ključnih datotek.

```
C:\Users\admin\projects\fullstack\agentflow-pro\
│
├── .cursor/                         # Cursor AI konfiguracija
│   ├── rules/                       # 5 custom .mdc pravil za AgentFlow
│   │   ├── agentflow-deploy.mdc
│   │   ├── agentflow-monetary.mdc
│   │   ├── agentflow-orchestrator.mdc
│   │   ├── agentflow-testing.mdc
│   │   └── agentflow-workflow.mdc
│   └── MCP_REQUIRED.md
│
├── .github/                         # CI/CD Pipeline
│   └── workflows/
│       ├── ci.yml                   # Lint, test, build on push
│       ├── e2e.yml                  # E2E (Postgres, Playwright) on PR
│       ├── deploy.yml              # Vercel deploy (workflow_dispatch only)
│       ├── security.yml            # Security scan
│       └── release.yml              # Auto-release
│
├── .vercel/                         # Vercel deploy config
│   ├── project.json
│   └── README.txt
│
├── src/                             # SOURCE CODE
│   ├── agents/                      # 4 AI Agenta
│   │   ├── research/
│   │   │   ├── firecrawl.ts         # Firecrawl API client
│   │   │   ├── brave.ts             # Brave Search client
│   │   │   └── ResearchAgent.ts
│   │   ├── content/
│   │   │   ├── context7.ts          # Context7 API client
│   │   │   ├── content-generator.ts
│   │   │   ├── seo-optimizer.ts
│   │   │   └── ContentAgent.ts
│   │   ├── code/
│   │   │   ├── github-client.ts     # GitHub/Octokit client
│   │   │   ├── code-generator.ts
│   │   │   ├── code-reviewer.ts
│   │   │   └── CodeAgent.ts
│   │   └── deploy/
│   │       ├── vercel-client.ts
│   │       ├── netlify-client.ts
│   │       ├── deploy-manager.ts
│   │       └── DeployAgent.ts
│   │
│   ├── orchestrator/
│   │   └── Orchestrator.ts          # Multi-agent coordination
│   │
│   ├── memory/                      # Knowledge Graph
│   │   ├── graph-schema.ts
│   │   ├── entity-manager.ts
│   │   ├── relation-manager.ts
│   │   ├── observation-manager.ts
│   │   ├── graph-manager.ts
│   │   ├── session-manager.ts
│   │   ├── context-loader.ts
│   │   ├── sync-service.ts
│   │   └── memory-backend.ts
│   │
│   ├── workflows/                   # Workflow Builder engine
│   │   ├── types.ts
│   │   ├── nodes.ts
│   │   ├── validator.ts
│   │   ├── conditions.ts
│   │   ├── error-handler.ts
│   │   └── executor.ts
│   │
│   ├── stripe/                      # Monetization
│   │   ├── config.ts
│   │   ├── plans.ts                 # $29/$99/$499 plans
│   │   ├── checkout.ts
│   │   ├── webhooks.ts
│   │   └── subscription.ts
│   │
│   ├── api/                         # API services
│   │   ├── workflows.ts
│   │   ├── billing.ts
│   │   └── usage.ts
│   │
│   ├── app/                         # Next.js App Router (pages + API)
│   │   ├── page.tsx                 # Homepage
│   │   ├── layout.tsx
│   │   ├── providers.tsx            # SessionProvider
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── pricing/page.tsx
│   │   ├── workflows/page.tsx       # Workflow editor
│   │   ├── memory/page.tsx          # Knowledge Graph UI
│   │   └── api/                     # API routes
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/register/route.ts
│   │       ├── billing/route.ts
│   │       ├── health/route.ts
│   │       ├── usage/route.ts
│   │       ├── workflows/route.ts
│   │       ├── workflows/[id]/route.ts
│   │       ├── memory/entities/route.ts
│   │       ├── memory/graph/route.ts
│   │       └── webhooks/stripe/route.ts
│   │
│   ├── web/components/              # React components
│   │   ├── workflow/
│   │   │   ├── WorkflowCanvas.tsx   # React Flow editor
│   │   │   ├── WorkflowNode.tsx
│   │   │   └── Toolbar.tsx
│   │   ├── pricing/
│   │   │   └── PricingTable.tsx
│   │   └── Nav.tsx
│   │
│   ├── lib/                         # Shared utilities
│   │   ├── auth-options.ts
│   │   └── auth-users.ts
│   │
│   ├── database/
│   │   └── schema.ts                # Prisma client export
│   │
│   └── types/
│       └── next-auth.d.ts
│
├── tests/                           # 60 unit tests + E2E
│   ├── agents/
│   │   ├── research.test.ts
│   │   ├── content.test.ts
│   │   ├── code.test.ts
│   │   └── deploy.test.ts
│   ├── memory/
│   │   ├── graph.test.ts
│   │   ├── session.test.ts
│   │   ├── sync.test.ts
│   │   └── integration.test.ts
│   ├── workflows/
│   │   ├── types-validator.test.ts
│   │   ├── conditions.test.ts
│   │   └── executor.test.ts
│   ├── stripe/
│   │   ├── plans.test.ts
│   │   ├── checkout.test.ts
│   │   └── webhooks.test.ts
│   └── e2e/
│       ├── fixtures.ts
│       ├── global-setup.ts
│       ├── auth.spec.ts
│       ├── workflow-create.spec.ts
│       ├── workflow-execute.spec.ts
│       ├── billing-checkout.spec.ts
│       ├── billing-usage.spec.ts
│       ├── knowledge-graph.spec.ts
│       └── deploy-vercel.spec.ts    # Skipped in CI
│
├── docs/
│   ├── CONTRIBUTING.md
│   ├── DEPLOYMENT.md
│   ├── LAUNCH-TIMELINE.md
│   ├── PRODUCTION-TEST-RESULTS.md
│   ├── RELEASE.md
│   ├── STRIPE-SETUP.md
│   ├── VERCEL-ENV-CHECKLIST.md
│   ├── VERCEL-ENV-NOW.md
│   └── launch-announcement.md
│
├── scripts/
│   ├── backup.bat                   # Backup to F:\backup\agentflow-pro
│   ├── pre-commit.sh
│   └── post-deploy.sh
│
├── prisma/
│   ├── schema.prisma                # User, Subscription, Workflow, AgentRun
│   ├── seed.ts                      # E2E user seed
│   └── migrations/
│
├── memory-bank/current/
│   ├── entities.md
│   ├── relations.md
│   └── observations.md
│
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
├── jest.config.js
├── playwright.config.ts
├── eslint.config.mjs
├── .gitignore
├── .env.example
├── .cursorrules
├── AGENTS.md
├── ZAGON.md
├── project-brief.md
├── tasks.md
└── README.md
```

## Ključne poti

| Namen | Pot |
|-------|-----|
| Workflow editor | `src/app/workflows/page.tsx` + `src/web/components/workflow/` |
| Pricing / billing | `src/app/pricing/page.tsx` + `src/app/api/billing/route.ts` |
| Auth | `src/lib/auth-options.ts` + `src/app/api/auth/` |
| Workflow execution | `src/workflows/executor.ts` + `src/api/workflows.ts` |
| Stripe | `src/stripe/` |
| Database | `prisma/schema.prisma` |
