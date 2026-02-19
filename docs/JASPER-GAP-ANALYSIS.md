# AgentFlow Pro vs Jasper – Gap analiza

Primerjava funkcij: kaj ima Jasper več in kaj bi lahko dodali v AgentFlow Pro.

---

## Kar imamo (AgentFlow Pro)

| Funkcija | Status |
|----------|--------|
| AI agenti (Research, Content, Code, Deploy) | Da |
| Visual workflow builder | Da |
| Generate blog posts (10 naenkrat) | Da |
| Chat z kontekstom | Da |
| Brand Voice (onboarding, blog URL analysis, guardrails) | Da |
| Style Guide (onboarding) | Da |
| Company Knowledge (products, competitors, key facts) | Da – Onboarding + Settings |
| Content history, publish (WordPress, Medium) | Da |
| Knowledge Graph / Memory MCP | Da |
| Stripe monetizacija | Da |
| BYOK (API keys v Settings) | Da |
| Save from Chat → BlogPost | Da |
| **Visual Guidelines** (barve, font, logo) | Da – onboarding step 7 |
| **Prompt Library** (blog, social, email) | Da – /prompts |
| **Audience** (2–3 ciljne skupine, messaging) | Da – onboarding step 8 |
| **Grid view** (bulk generate/edit 50 postov) | Da – /content/grid |
| **Image generation** (DALL-E) | Da – content detail modal |
| **Solutions by Role** (Content, Product, Brand) | Da – /solutions/[role] |
| **Solutions by Industry** (Tech, E-commerce) | Da – /solutions/industry/[slug] |
| **Personalization** (template + JSON data) | Da – /personalize |
| **Marketing Editor** (inline Improve, Expand, Shorten) | Da – content detail |
| **LinkedIn, Twitter OAuth** publish | Da – Settings Publish Connections |
| **HubSpot** (OAuth, contacts, companies) | Da – Settings Connect HubSpot |
| **Canvas** (vizualno planiranje kampanj) | Da – /canvas, team boards, Pusher |
| **Team roles** (brand approver, team switcher) | Da – /settings/teams |
| **Public API** (API keys) | Da – Settings / Public API |
| **AI Audit Logs** | Da – Settings / Audit |

---

## Kar ima Jasper več

### 1. Brand & Context (Jasper IQ)

| Jasper | AgentFlow | Gap |
|--------|-----------|-----|
| **Brand Voice** – analiza, guardrails | Brand Voice iz blog URL (onboarding) | **IMPLEMENTIRANO** – validateAgainstBrandVoice v generate-content, guardrailIssues v content |
| **Style Guide** | Style Guide (ročni vnos) | Enako – imamo |
| **Visual Guidelines** | Visual Guidelines (onboarding step 7) | **IMPLEMENTIRANO** – barve, fonti, logo |
| **Audience** – definirane ciljne skupine, messaging | Audience (onboarding step 8, audiences JSON) | **IMPLEMENTIRANO** – Generate izbira audience |
| **Knowledge Base** – company data, competitors, product | Onboarding + Settings Company Knowledge | **IMPLEMENTIRANO** – companyKnowledge v Onboarding, content pipeline, urejanje v Settings |
| **Marketing IQ** – marketing best practices | SEO, GEO, AEO v Optimize modal | **IMPLEMENTIRANO** |

### 2. Content Creation UX

| Jasper | AgentFlow | Gap |
|--------|-----------|-----|
| **Canvas** – workspace, planiranje, kolaboracija | /canvas, CampaignBoard, React Flow, team boards | **IMPLEMENTIRANO** – vizualno planiranje kampanj, real-time z Pusher |
| **Grid** – spreadsheet bulk content | /content/grid (bulk 50, edit, pipeline stages) | **IMPLEMENTIRANO** |
| **Image Suite** – generiranje slik | /api/generate-image, content modal (DALL-E) | **IMPLEMENTIRANO** |
| **Marketing Editor** | Content detail + inline Improve/Expand/Shorten | **IMPLEMENTIRANO** |

### 3. Agents & Automation

| Jasper | AgentFlow | Gap |
|--------|-----------|-----|
| **Optimization Agent** – SEMrush, headlines, meta, internal links | SEO Optimize modal (keywords, meta, headlines, internal links) | Delno – brez zunanjih orodij (SEMrush) |
| **Personalization Agent** – data → osebni content | /personalize (template + JSON) | **IMPLEMENTIRANO** |
| **Research Agent** | Research agent | Podobno |
| **Content Pipelines** – data → creation → distribution | /content/pipeline (Kanban), Grid pipelineStage | **IMPLEMENTIRANO** |

### 4. Platform & Integrations

| Jasper | AgentFlow | Gap |
|--------|-----------|-----|
| **1000+ integracij** | WordPress, Medium, GitHub, Vercel, LinkedIn, Twitter, HubSpot | HubSpot **IMPLEMENTIRANO** (OAuth, contacts, companies); manjka Salesforce |
| **Chrome extension** | extensions/chrome (Manifest v3) | **IMPLEMENTIRANO** |
| **Studio** – no-code app builder | Workflow builder | Različna paradigma – Studio = apps, mi = workflows |
| **App Library** – ready-made apps | /apps (workflow templates) | **IMPLEMENTIRANO** |
| **API** | Public API (Settings, API keys) | **IMPLEMENTIRANO** |
| **Jasper MCP** | Memory MCP, agents | Jasper MCP = njihov model načrtovanja |

### 5. Enterprise & Trust

| Jasper | AgentFlow | Gap |
|--------|-----------|-----|
| **Trust Foundation** – security, governance | Auth, limits, AI Audit Logs (Settings/Audit) | Delno – manjka admin controls |
| **Governance** – roles, permissions, brand-safe access | /settings/teams, brand approver, team switcher | **IMPLEMENTIRANO** – team roles, invite flow, approval workflow |
| **SOC2, GDPR** | – | Odvisno od deploya |

### 6. Marketing & GTM

| Jasper | AgentFlow | Gap |
|--------|-----------|-----|
| **Solutions by Role** (Product, Content, Brand, …) | /solutions/[role] | **IMPLEMENTIRANO** |
| **Solutions by Industry** (Tech, eCommerce, …) | /solutions/industry/[slug] | **IMPLEMENTIRANO** |
| **SEO, AEO, GEO** – optimizacija | SEO, GEO, AEO v Optimize modal | **IMPLEMENTIRANO** |
| **Customer Stories** – case studies na landing | /stories, landing section | **IMPLEMENTIRANO** – 3 case studies |
| **Community, Courses, Certifications** | – | **MANJKA** |
| **Prompt Library** | /prompts | **IMPLEMENTIRANO** |

---

## Prioritizirana gap lista (kaj dodati najprej)

### P1 – Hitri wins (že implementirano ali ostalo)

1. ~~**Visual Guidelines**~~ – **IMPLEMENTIRANO** (onboarding step 7)
2. ~~**Prompt Library**~~ – **IMPLEMENTIRANO** (/prompts)
3. ~~**Customer Stories**~~ – **IMPLEMENTIRANO** (/stories, landing, docs link)

### P2 – Srednji scope (že implementirano ali ostalo)

4. ~~**Grid view**~~ – **IMPLEMENTIRANO** (/content/grid)
5. ~~**Audience**~~ – **IMPLEMENTIRANO** (onboarding step 8)
6. ~~**Image generation**~~ – **IMPLEMENTIRANO** (DALL-E, content modal)
7. ~~**Personalization Agent**~~ – **IMPLEMENTIRANO** (/personalize)
8. ~~**Solutions by Role**~~ – **IMPLEMENTIRANO** (/solutions/[role])

### P3 – Večji projekti (ostalo)

9. ~~**Content Pipelines**~~ – **IMPLEMENTIRANO** (/content/pipeline)
10. ~~**Chrome extension**~~ – **IMPLEMENTIRANO** (extensions/chrome)
11. ~~**App Library**~~ – **IMPLEMENTIRANO** (/apps)
12. ~~**Canvas**~~ – **IMPLEMENTIRANO** (/canvas, CampaignBoard, team boards, Pusher)
13. ~~**Team roles / Governance**~~ – **IMPLEMENTIRANO** (/settings/teams, brand approver, team switcher)

---

## Povzetek

AgentFlow ima trden foundation (workflows, multi-agent, brand voice, style guide). **Večina P1/P2 točk je implementirana:**

- **IMPLEMENTIRANO:** Visual Guidelines, Audience, Prompt Library, Grid, Image gen, Solutions (Role/Industry), Personalization, Marketing Editor, Public API, AI Audit Logs, LinkedIn/Twitter publish, Brand Voice guardrails, Company Knowledge (Onboarding + Settings), Canvas, Team roles, HubSpot.

**Glavne vrzeli:**

- ~~**Customer Stories**~~ – **IMPLEMENTIRANO** (3 case studies na /stories)
- ~~**Content Pipelines**~~ – **IMPLEMENTIRANO** (/content/pipeline)
- ~~**Chrome extension**~~ – **IMPLEMENTIRANO** (extensions/chrome)
- ~~**App Library**~~ – **IMPLEMENTIRANO** (/apps)
- ~~**GEO/AEO**~~ – **IMPLEMENTIRANO** (Optimize modal)
- ~~**Canvas, Team roles**~~ – **IMPLEMENTIRANO** (/canvas, /settings/teams)
- ~~**HubSpot**~~ – **IMPLEMENTIRANO** (OAuth, contacts, companies)
- **Integracije** – manjka Salesforce
- **Admin controls** – Trust Foundation (delno)

Za Jasper pariteto: skoraj vse vrzeli so zapolnjene. Ostane: Salesforce (opcijsko), admin controls.
