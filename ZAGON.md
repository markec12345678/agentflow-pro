# AgentFlow Pro - Zagon

## KAJ PRIČAKOVATI V PRVIH 30 MINUTAH

| Čas | Kaj se dogaja |
|-----|---------------|
| 0-5 min | AI bere project-brief.md + tasks.md |
| 5-10 min | Memory search (mcp_memory_search_nodes) |
| 10-20 min | Ustvari project strukturo |
| 20-30 min | Git init + prvi commit |

---

## POMEMBNO

| Če... | Naredi to |
|-------|-----------|
| AI vpraša za potrditev | Potrdi za Phase 1 task-e |
| MCP error | Preveri API keys v .env |
| Git error | Preveri `git config user.name` / `git config user.email` |
| Stuck | Uporabi `/plan` za reset |

---

## FINALNA CHECKLISTA PRED ZAGONOM

- [ ] Vse 13 datotek ustvarjenih
- [ ] mcp.json konfiguriran
- [ ] API keys v .env (GitHub, Vercel, Stripe, Firecrawl, Context7)
- [ ] Git inicializiran
- [ ] Terminal odprt (Cmd + `)
- [ ] Cursor Chat odprt (Cmd + L)

### MCP Checklist

1. Kopiraj `.env.example` v `.env`
2. Vpiši `GITHUB_TOKEN`, `FIRECRAWL_API_KEY`, `CONTEXT7_API_KEY` v `.env`
3. Restart Cursorja po spremembah `mcp.json`

---

## ZDAJ JE TVOJ POTEZ

V Cursor Chat vpiši:

```
/samodejno fullstack AgentFlow Pro
```
