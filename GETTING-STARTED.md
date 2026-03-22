# AgentFlow Pro - Getting Started

## WHAT TO EXPECT IN THE FIRST 30 MINUTES

| Time | What's Happening |
|------|------------------|
| 0-5 min | AI reads project-brief.md + tasks.md |
| 5-10 min | Memory search (mcp_memory_search_nodes) |
| 10-20 min | Creates project structure |
| 20-30 min | Git init + first commit |

---

## IMPORTANT

| If... | Do This |
|-------|---------|
| AI asks for confirmation | Confirm for Phase 1 tasks |
| MCP error | Check API keys in .env |
| Git error | Check `git config user.name` / `git config user.email` |
| Stuck | Use `/plan` to reset |

---

## FINAL CHECKLIST BEFORE START

- [ ] All 13 files created
- [ ] mcp.json configured
- [ ] API keys in .env (GitHub, Vercel, Stripe, Firecrawl, Context7)
- [ ] Git initialized
- [ ] Terminal open (Cmd + `)
- [ ] Cursor Chat open (Cmd + L)

### MCP Checklist

1. Copy `.env.example` to `.env`
2. Enter `GITHUB_TOKEN`, `FIRECRAWL_API_KEY`, `CONTEXT7_API_KEY` in `.env`
3. Restart Cursor after changes to `mcp.json`

---

## NOW IT'S YOUR TURN

In Cursor Chat, type:

```
/samodejno fullstack AgentFlow Pro
```
