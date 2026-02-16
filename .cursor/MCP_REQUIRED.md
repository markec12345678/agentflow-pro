# AgentFlow Pro - MCP Requirements

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
