---
inclusion: always
---

# AgentFlow Orchestrator Rules

## MCP Layers (avtomatsko)

- **Database:** Neon MCP – run_sql, describe_table_schema (če je dostopen)
- **HTTP:** Cursor built-in mcp_web_fetch
- **Memory:** mcp_memory_search_nodes, add_observations, create_entities
- **Repo:** GitHub MCP, Git MCP
- **Sandbox:** Docker MCP za containere

## Agent Coordination

- Vedno uporabi Sequential Thinking MCP za kompleksne odločitve
- Research Agent mora uporabiti Firecrawl + Brave Search
- Content Agent mora uporabiti Context7 za sveže dokumentacije
- Code Agent mora uporabiti GitHub MCP za vse operacije
- Deploy Agent mora uporabiti Vercel MCP za deployment

## Memory Integration

- Ob začetku vsake seje: mcp_memory_search_nodes
- Ob vsaki agent odločitvi: mcp_memory_add_observations
- Ob koncu task-a: mcp_memory_create_entities
- Ob napakah: mcp_memory_add_observations z error details

## Small Steps

- Max 1 file naenkrat
- Max 100 vrstic kode na commit
- Vedno run teste pred commitom
- Git commit po vsaki večji spremembi

## Test Before Commit (avtomatsko)

- **Pred commitom:** Vedno zaženi `npm run precommit` (lint + test)
- **Če testi padejo:** Popravi kodo na podlagi error outputa, nato ponovno zaženi `npm run precommit`
- **Ne committaj** dokler `npm run precommit` ne uspe
- Husky pre-commit hook: ob `git commit` avtomatsko zažene precommit; če pade, commit se ustavi

## Error Handling

- Vse napake logiraj v Sentry
- Nikoli ne ignoriraj errorjev
- Implementiraj retry logic za MCP calls
- Fallback options za vsak agent
