# AGENTS.md - AgentFlow Pro

## 🤖 AI Agent Guidelines

### Primary Agent Behavior

1. Vedno uporabi `/samodejno` za začetek delovnih seans
2. Uporabi Memory MCP ob začetku vsake seje
3. Small steps pristop (max 1 file naenkrat)
4. Git commit po vsaki večji spremembi
5. Testiraj pred commitom

### MCP Usage Rules

| MCP | When to Use |
|-----|-------------|
| Memory | Ob začetku seje, ob odločitvah, ob koncu task-a |
| GitHub | Vse code operacije, PR creation |
| Playwright | E2E testing, browser automation |
| **Screenshot** | Pri debugiranju UI/login: `npm run capture:login` (zahteva dev server), nato preberi `screenshots/capture.png` |
| Firecrawl | Web scraping za research |
| Context7 | Sveže API dokumentacije |
| Vercel | Frontend deployment |
| Docker | Agent containerization |
| Sentry | Error tracking |
| Sequential Thinking | Kompleksne odločitve |

### /samodejno Workflow

1. Preberi project-brief.md
2. Preberi tasks.md
2.5. Za roadmap/prioritete/naloge iz raziskave: preberi docs/RAZISKAVA-VS-IMPLEMENTACIJA-ROADMAP.md
3. Search memory bank za kontekst
4. Izvedi naslednji task iz tasks.md
5. Update progress.md
6. Git commit + push
7. Repeat

### Pogled na UI (Agent mora SAM zagnati – uporabnik tega NE dela)

**Ob napakah pri prijavi, registraciji ali drugih UI težavah agent SAM:**
1. Zaženi `npm run capture:login` (ali `npm run capture:page -- <URL>`)
2. Preberi `agentflow-pro/screenshots/capture.png` z read_file
3. Analiziraj vsebino slike za diagnozo

Zahteva: dev server teče, `playwright install` narejen. Screenshot orodje je na voljo agentu, ne uporabniku.

### Review Points (Vprašaj Uporabnika)

- Brisanje obstoječih datotek
- Sprememba database sheme
- Novi API keys
- Večji refactoring
- Production deploy

### Communication Style

- Bodite concise in direct
- Explain reasoning before code
- Suggest improvements
- Flag potential issues early
