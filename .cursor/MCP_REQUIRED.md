# AgentFlow Pro - MCP Requirements

## MCP Best Practices (2026)

- Stringent validation
- OAuth/OIDC za avtentikacijo
- Viri: [akto.io](https://www.akto.io), [strata.io](https://www.strata.io)

## KORAK 3: /samodejno Command

V Cursor Chat (Cmd + L) vpiši:

```
/samodejno fullstack AgentFlow Pro - Multi-Agent AI Platform za business avtomatizacijo z Research, Content, Code, Deploy agenti, workflow builder, Memory knowledge graph, Stripe subscription, Playwright E2E testi, deploy na Vercel, Docker containers, Sentry monitoring
```

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
