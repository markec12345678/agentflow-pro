# AgentFlow Pro - Feature Map

Maps every feature to its UI location. Use for audits and ensuring feature visibility.

---

## Global Navigation (Navbar)

| Funkcija | Lokacija v UI | Status |
|----------|---------------|--------|
| Workflows | /workflows | Yes |
| App Library | /apps | Yes |
| Pricing | /pricing | Yes |
| Dashboard | /dashboard | Yes |
| Take Tour | /dashboard?tour=1 (session only) | Yes |
| Generate | /generate | Yes |
| Prompt Library | /prompts | Yes |
| My Content | /content | Yes |
| Grid | /content/grid | Yes |
| Pipeline | /content/pipeline | Yes |
| Canvas | /canvas | Yes |
| Chat | /chat | Yes |
| Memory | /memory | Yes |
| Monitoring | /monitoring | Yes |
| Contact | /contact | Yes |
| Profile | /profile (session only) | Yes |
| Settings | /settings (session only) | Yes |
| Login | /login | Yes |
| Get Started | /onboarding | Yes |

---

## AI Agents (4 core)

| Agent | Kako dostopati | UI Komponenta |
|-------|----------------|---------------|
| Research Agent | Workflows → drag "Agent" node → set agentType: research | workflows/page.tsx, WorkflowNode |
| Content Agent | Workflows → drag "Agent" node → set agentType: content | workflows/page.tsx |
| Code Agent | Workflows → drag "Agent" node → set agentType: code | workflows/page.tsx |
| Deploy Agent | Workflows → drag "Agent" node → set agentType: deploy | workflows/page.tsx |

---

## Tourism Layer

| Funkcija | Kako dostopati | UI Komponenta |
|----------|----------------|---------------|
| Booking.com Opis Nastanitve | Prompt Library → filter "Tourism" → "Booking.com Opis Nastanitve" → Use in Generate/Chat | prompts/page.tsx |
| Airbnb Storytelling Opis | Prompt Library → filter "Tourism" → "Airbnb Storytelling Opis" → Use in Generate/Chat | prompts/page.tsx |
| Vodič po Destinaciji | Prompt Library → filter "Tourism" → "Vodič po Destinaciji" → Use in Generate/Chat | prompts/page.tsx |
| Sezonska Kampanja | Prompt Library → filter "Tourism" → "Sezonska Kampanja" → Use in Generate/Chat | prompts/page.tsx |
| Instagram Travel Caption | Prompt Library → filter "Tourism" → "Instagram Travel Caption" → Use in Generate/Chat | prompts/page.tsx |
| Multi-language | Variables (jezik) in prompt templates; no dedicated LanguageSelector dropdown | prompts.ts variables |

---

## Core Platform Features

| Funkcija | Lokacija | Status |
|----------|----------|--------|
| Visual Workflow Builder | /workflows | Yes – React Flow (xyflow) |
| Brand Voice / Guardrails | /onboarding → style guide, company knowledge | Yes |
| Bulk Generate | /generate → "Generate 10 Blog Posts" | Yes |
| Export (JSON/Markdown) | /content → Export (.md), Export (.json) | Yes |
| API Access | /settings/api-keys | Yes |
| Stripe Subscription | /pricing → Checkout CTA | Yes – no dedicated Stripe Portal link in UI |

---

## User Management

| Funkcija | Lokacija | Status |
|----------|----------|--------|
| Login | /login | Yes – NextAuth |
| Register | /register | Yes – NextAuth |
| Onboarding | /onboarding | Yes |
| Profile Settings | /profile | Yes |
| Settings | /settings | Yes |
| API Keys Management | /settings/api-keys | Yes |
| Subscription Management | /pricing (checkout); cancel via billing API | Yes |

---

## Additional Routes

| Route | Description |
|-------|-------------|
| /apps | App Library – workflow templates |
| /canvas | Content Brief canvas |
| /content/grid | Content grid view |
| /content/pipeline | Content pipeline |
| /personalize | Personalize (mobile nav) |
| /solutions/industry/[slug] | Industry solutions |
| /solutions/[role] | Role-based solutions |
| /docs | Documentation |
| /docs/api | API documentation |
| /admin | Admin panel |
| /monitoring | Monitoring dashboard |
