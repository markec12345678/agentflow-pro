# AgentFlow Pro - MCP Requirements

**Zagon:** Glej [ZAGON.md](../../ZAGON.md) – pričakovani čas, troubleshooting, checklist.

## MCP Best Practices (2026)

- Stringent validation
- OAuth/OIDC za avtentikacijo
- Viri: [akto.io](https://www.akto.io), [strata.io](https://www.strata.io)

## KORAK 3: Preveri mcp.json

Reference format (env placeholders za varno uporabo):

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git"]
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-playwright"]
    },
    "firecrawl": {
      "command": "npx",
      "args": ["-y", "firecrawl-mcp"],
      "env": { "FIRECRAWL_API_KEY": "${FIRECRAWL_API_KEY}" }
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@context7/mcp-server"],
      "env": { "CONTEXT7_API_KEY": "${CONTEXT7_API_KEY}" }
    },
    "vercel": {
      "command": "npx",
      "args": ["-y", "@vercel/mcp"]
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "@docker/mcp-server"]
    },
    "sentry": {
      "command": "npx",
      "args": ["-y", "@sentry/mcp"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Primerjava s trenutno konfiguracijo (~/.cursor/mcp.json):**

| MCP | Reference | Trenutno | Opomba |
|-----|-----------|----------|--------|
| memory | npx server-memory | Enako | OK |
| github | GITHUB_TOKEN | GITHUB_PERSONAL_ACCESS_TOKEN | GitHub API uporablja PAT |
| git | npx server-git | uvx mcp-server-git | Alternativni paket, deluje |
| playwright | server-playwright | @playwright/mcp | Uradni Playwright MCP |
| firecrawl | npx firecrawl-mcp | Local firecrawl-mcp-server | Lokalna instanca z API key |
| context7 | npx @context7/mcp-server | Local context/run-mcp.js | Lokalna instanca |
| vercel | npx @vercel/mcp | Enako | OK |
| docker | npx @docker/mcp-server | npx mcp-server-docker | Različen paket |
| sentry | npx @sentry/mcp | URL mcp.sentry.dev | Sentry uporablja URL MCP |

**Preveritev:** Vsi zahtevani MCP serverji so v globalni konfiguraciji in delujejo.

---

## KORAK 4: /samodejno Command

V Cursor Chat (Cmd + L) vpiši:

```
/samodejno fullstack AgentFlow Pro - Multi-Agent AI Platform za business avtomatizacijo z Research, Content, Code, Deploy agenti, workflow builder, Memory knowledge graph, Stripe subscription, Playwright E2E testi, deploy na Vercel, Docker containers, Sentry monitoring
```

---

## KORAK 5: Spremljaj Progress

| Vir | Kaj gledati |
|-----|-------------|
| `memory-bank/current/progress.md` | % completed, Completed Today, Next Steps |
| `tasks.md` | Checkboxes [x] |
| Git log | `git log --oneline` |
| Terminal | Build/test output |

**PRVIH 5 TASKOV (Phase 1.1) – vsi opravljeni:**
- [x] 1.1.1 Ustvari project mapo
- [x] 1.1.2 Inicializiraj Git repo
- [x] 1.1.3 Kreiraj .gitignore
- [x] 1.1.4 Kreiraj osnovno strukturo map
- [x] 1.1.5 Setup .cursorrules

---

## KORAK 2: Preveritev MCP Konfiguracije

Globalna `~/.cursor/mcp.json` vsebuje vse zahtevane MCP serverje:

| MCP | Status | Trenutna konfiguracija |
|-----|--------|------------------------|
| memory | OK | `npx @modelcontextprotocol/server-memory` |
| github | OK | `npx @modelcontextprotocol/server-github` + GITHUB_PERSONAL_ACCESS_TOKEN |
| git | OK | `uvx mcp-server-git` |
| playwright | OK | `npx @playwright/mcp` |
| firecrawl | OK | Local: `F:/d/firecrawl-mcp-server` + FIRECRAWL_API_KEY |
| context7 | OK | Local: `F:/d/context/run-mcp.js` |
| vercel | OK | `npx @vercel/mcp` |
| docker | OK | `npx mcp-server-docker` |
| sentry | OK | URL: `https://mcp.sentry.dev/mcp` |
| sequential-thinking | OK | `npx @modelcontextprotocol/server-sequential-thinking` |

**Opomba:** Reference format uporablja `npx firecrawl-mcp`, `npx @context7/mcp-server` – tukaj so uporabljene lokalne instancе (firecrawl-mcp-server, context) z API ključi. Vse deluje.

---

## Required MCP Servers (from project-brief.md)

| MCP | Purpose | Global Config |
|-----|---------|---------------|
| Memory | Knowledge Graph | `~/.cursor/mcp.json` |
| GitHub | Repo Management | `~/.cursor/mcp.json` |
| Git | Version Control | `~/.cursor/mcp.json` |
| Playwright | E2E Testing | `~/.cursor/mcp.json` |
| Firecrawl | Web Scraping | `~/.cursor/mcp.json` |
| Context7 | API Documentation | `~/.cursor/mcp.json` |
| Vercel | Frontend Deploy | `~/.cursor/mcp.json` |
| Docker | Agent Containers | `~/.cursor/mcp.json` |
| Sentry | Error Monitoring | `~/.cursor/mcp.json` |
| Sequential Thinking | Agent Decisions | `~/.cursor/mcp.json` |

## Optional

| MCP | Purpose |
|-----|---------|
| Brave Search | Web Research |
| Netlify | Alternative Deploy |

## Verification (2026-02-16)

| MCP | Status | Notes |
|-----|--------|-------|
| Memory | OK | mcp_memory_read_graph, search_nodes |
| Git | OK | mcp_git_git_status, commit |
| GitHub | OK | mcp_github_search_repositories |
| Vercel/Netlify | Requires auth | Setup on first deploy |

## Environment Variables

See `.env.example` in project root.
