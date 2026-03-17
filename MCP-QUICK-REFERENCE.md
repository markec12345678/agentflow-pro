# 🚀 MCP Hitra Referenca - AgentFlow Pro

## ✅ Nameščeni MCP Serverji (30+)

```
✅ neon              - PostgreSQL database
✅ postgres          - Direct SQL operations  
✅ memory            - Knowledge Graph
✅ git               - Git operations
✅ github            - GitHub API
✅ playwright        - E2E testing
✅ firecrawl         - Web scraping
✅ context7          - API docs
✅ vercel            - Deployment
✅ docker            - Containers
✅ sentry            - Error tracking
✅ sequential-thinking - Decision making
✅ stripe            - Payments ⏳
✅ redis             - Caching ⏳
✅ brave-search      - Web search ⏳
✅ fetch             - HTTP calls
✅ time              - Scheduling
✅ everart           - AI images ⏳
✅ cloudflare        - Edge ⏳
✅ openai            - LLM ⏳
✅ google-ai         - Gemini ⏳
✅ resend            - Email ⏳
✅ pusher            - Real-time ⏳
✅ qdrant            - Vector search ⏳
✅ twilio            - SMS ⏳
✅ slack             - Notifications ⏳
✅ salesforce        - CRM ⏳
✅ filesystem        - File access
✅ everything        - Testing
✅ gmail             - Gmail
✅ googlecalendar    - Calendar
✅ g (Sheets)        - Google Sheets
✅ googledrive       - Drive
✅ googledocs        - Docs
✅ youtube           - YouTube
✅ notion            - Notion
✅ airtable          - Airtable
✅ sub (Supabase)    - Supabase
```

⏳ = Čaka API ključ v .env

---

## 🔑 Nujno Potrebni API Ključi

### Tier 1 (Kritično za delovanje)
```bash
# Stripe - payments
STRIPE_SECRET_KEY="sk_test_..."

# Redis - caching
UPSTASH_REDIS_REST_URL="https://..."

# OpenAI - agenti
OPENAI_API_KEY="sk-..."
```

### Tier 2 (Priporočljivo)
```bash
# Brave Search - research
BRAVE_API_KEY="..."

# Resend - email
RESEND_API_KEY="re_..."

# Sentry - monitoring
SENTRY_DSN="https://..."
```

### Tier 3 (Opcijsko)
```bash
# Vercel - deploy
VERCEL_TOKEN="..."

# Twilio - SMS
TWILIO_ACCOUNT_SID="..."

# Slack - notifications
SLACK_ESCALATION_WEBHOOK_URL="https://..."
```

---

## 💻 Ukazi za Testiranje

### Preveri MCP status
```
V Cursor Chat: /mcp list
```

### Testiraj Stripe
```
Ustvari Stripe produkt "Test" s ceno $10
```

### Testiraj Redis
```
Shrani "hello" v Redis pod ključem "test" in preberi
```

### Testiraj Postgres
```
Preveri koliko tabel je v bazi
```

### Testiraj Memory
```
Kaj veš o AgentFlow Pro projektu?
```

---

## 📊 MCP Layerji

```
┌─────────────────────────────────────────┐
│  AI/LLM Layer                           │
│  openai, google-ai, everart             │
├─────────────────────────────────────────┤
│  Research Layer                         │
│  firecrawl, brave-search, context7      │
├─────────────────────────────────────────┤
│  Memory Layer                           │
│  memory, qdrant, redis, postgres        │
├─────────────────────────────────────────┤
│  Business Layer                         │
│  stripe, salesforce, resend, twilio     │
├─────────────────────────────────────────┤
│  DevOps Layer                           │
│  github, git, vercel, docker, sentry    │
├─────────────────────────────────────────┤
│  Communication Layer                    │
│  slack, pusher, gmail, calendar         │
└─────────────────────────────────────────┘
```

---

## 🎯 Uporaba po Agentih

### Research Agent
```typescript
Tools: firecrawl, brave-search, context7
```

### Content Agent
```typescript
Tools: openai, google-ai, everart, resend
```

### Code Agent
```typescript
Tools: github, git, filesystem, playwright
```

### Deploy Agent
```typescript
Tools: vercel, docker, cloudflare, sentry
```

### Business Agent
```typescript
Tools: stripe, salesforce, redis, postgres
```

### Orchestrator
```typescript
Tools: sequential-thinking, memory, time, pusher
```

---

## 📝 Zapomni Si

1. **Nikoli ne commitaj .env** v Git!
2. **API ključi so občutljivi** - nikoli jih ne deli
3. **Restartaj Cursor** po spremembi .env
4. **Testiraj postopoma** - en MCP naenkrat
5. **Uporabljaj env placeholdere** `${API_KEY}` v mcp.json

---

## 🔗 Dokumentacija

- Popolna navodila: `docs/MCP-CONFIGURATION.md`
- Environment setup: `.env.example`
- MCP config: `.cursor/mcp.json`

---

**🎓 Nivo:** Doktor za MCP integracije! 🎓
