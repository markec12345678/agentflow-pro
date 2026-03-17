# MCP Serverji - Popolna Konfiguracija za AgentFlow Pro

**Zadnja posodobitev:** Marec 2026  
**Status:** ✅ Vsi MCP-ji nameščeni in konfigurirani

---

## 📦 Nameščeni MCP Serverji (30+)

### Core Infrastructure

| MCP | Namen | Status |
|-----|-------|--------|
| `neon` | PostgreSQL database (HTTP) | ✅ Aktiven |
| `postgres` | PostgreSQL direct SQL operations | ✅ Nameščen |
| `memory` | Knowledge Graph - agent memory | ✅ Aktiven |
| `git` | Git operations (commit, status, diff) | ✅ Aktiven |
| `github` | GitHub API (PR, issues, repo management) | ✅ Aktiven |
| `filesystem` | Local file access | ✅ Nameščen |
| `everything` | Testing & debugging | ✅ Nameščen |

### Testing & Deployment

| MCP | Namen | Status |
|-----|-------|--------|
| `playwright` | E2E browser testing | ✅ Aktiven |
| `docker` | Container management | ✅ Aktiven |
| `vercel` | Frontend deployment | ✅ Aktiven |
| `cloudflare` | Edge deployment, Workers, R2 | ⏳ Čaka API ključ |

### AI & Research

| MCP | Namen | Status |
|-----|-------|--------|
| `firecrawl` | Web scraping & crawling | ✅ Aktiven |
| `context7` | API documentation lookup | ✅ Aktiven |
| `brave-search` | Web search (better than Google) | ⏳ Čaka API ključ |
| `fetch` | HTTP API calls | ✅ Nameščen |
| `openai` | OpenAI LLM integration | ⏳ Čaka API ključ |
| `google-ai` | Google Gemini LLM | ⏳ Čaka API ključ |
| `everart` | AI image generation | ⏳ Čaka API ključ |

### Business & Payments

| MCP | Namen | Status |
|-----|-------|--------|
| `stripe` | Payments, subscriptions, billing | ⏳ Čaka API ključ |
| `salesforce` | CRM integration | ⏳ Čaka API ključ |
| `resend` | Email delivery | ⏳ Čaka API ključ |
| `twilio` | SMS notifications | ⏳ Čaka API ključ |
| `slack` | Team notifications, escalations | ⏳ Čaka API ključ |

### Real-time & Caching

| MCP | Namen | Status |
|-----|-------|--------|
| `redis` | Caching, rate limiting, sessions | ⏳ Čaka URL |
| `pusher` | Real-time WebSocket events | ⏳ Čaka API ključ |
| `qdrant` | Vector search (semantic memory) | ⏳ Čaka API ključ |

### Productivity & Integrations

| MCP | Namen | Status |
|-----|-------|--------|
| `sequential-thinking` | Complex decision making | ✅ Aktiven |
| `time` | Time-based scheduling | ✅ Nameščen |
| `sentry` | Error tracking & monitoring | ⏳ Čaka DSN |
| `gmail` | Gmail integration | ✅ Na voljo |
| `googlecalendar` | Google Calendar | ✅ Na voljo |
| `g` (Sheets) | Google Sheets | ✅ Na voljo |
| `googledrive` | Google Drive | ✅ Na voljo |
| `googledocs` | Google Docs | ✅ Na voljo |
| `youtube` | YouTube API | ✅ Na voljo |
| `notion` | Notion workspace | ✅ Na voljo |
| `airtable` | Airtable database | ✅ Na voljo |
| `sub` (Supabase) | Supabase database | ✅ Na voljo |

---

## 🔑 API Ključi - Kako Dobiti

### 1. **Stripe** (Payments)
```bash
# .env
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```
**Navodila:**
1. Odpri https://dashboard.stripe.com/apikeys
2. Kopiraj "Secret key" (sk_test_...)
3. Kopiraj "Publishable key" (pk_test_...)
4. Za webhook: Stripe Dashboard → Developers → Webhooks → Add endpoint

---

### 2. **Redis** (Caching)
```bash
# .env
UPSTASH_REDIS_REST_URL="https://xxx.us-east-1-1.aws.cloud.upstash.io"
UPSTASH_REDIS_REST_TOKEN="..."
```
**Navodila:**
1. Odpri https://upstash.com
2. "Try Free" → Create Database
3. Izberi "Serverless Redis"
4. Kopiraj `UPSTASH_REDIS_REST_URL` in `UPSTASH_REDIS_REST_TOKEN`

---

### 3. **Brave Search** (Research)
```bash
# .env
BRAVE_API_KEY="..."
```
**Navodila:**
1. Odpri https://brave.com/search/api/
2. "Get API Key"
3. Free tier: 1000 queries/month

---

### 4. **OpenAI** (LLM)
```bash
# .env
OPENAI_API_KEY="sk-..."
```
**Navodila:**
1. Odpri https://platform.openai.com/api-keys
2. "Create new secret key"
3. Kopiraj key (se prikaže samo enkrat!)

---

### 5. **Google Gemini** (Fallback LLM)
```bash
# .env
GEMINI_API_KEY="..."
```
**Navodila:**
1. Odpri https://aistudio.google.com/app/apikey
2. "Create API Key"

---

### 6. **EverArt** (AI Images)
```bash
# .env
EVERART_API_KEY="..."
```
**Navodila:**
1. Odpri https://everart.ai
2. Sign up → API Access

---

### 7. **Cloudflare** (Edge)
```bash
# .env
CLOUDFLARE_API_TOKEN="..."
CLOUDFLARE_ACCOUNT_ID="..."
```
**Navodila:**
1. Odpri https://dash.cloudflare.com/profile/api-tokens
2. "Create Token" → "Edit Cloudflare Website"
3. Kopiraj token in Account ID

---

### 8. **Resend** (Email)
```bash
# .env
RESEND_API_KEY="re_..."
```
**Navodila:**
1. Odpri https://resend.com/api-keys
2. "Create API Key"

---

### 9. **Pusher** (Real-time)
```bash
# .env
PUSHER_APP_ID="..."
PUSHER_KEY="..."
PUSHER_SECRET="..."
PUSHER_CLUSTER="eu"
NEXT_PUBLIC_PUSHER_KEY="..."
NEXT_PUBLIC_PUSHER_CLUSTER="eu"
```
**Navodila:**
1. Odpri https://pusher.com
2. "Get Started" → Create App
3. Kopiraj credentials iz App Settings

---

### 10. **Qdrant** (Vector Search)
```bash
# .env
QDRANT_URL="https://xxx.us-east-1-1.aws.cloud.qdrant.io:6333"
QDRANT_API_KEY="..."
```
**Navodila:**
1. Odpri https://cloud.qdrant.io
2. Create Cluster
3. API Key: Dashboard → API Keys

---

### 11. **Twilio** (SMS)
```bash
# .env
TWILIO_ACCOUNT_SID="..."
TWILIO_AUTH_TOKEN="..."
TWILIO_FROM="+1234567890"
```
**Navodila:**
1. Odpri https://console.twilio.com
2. Dashboard → Account Info
3. Kopiraj Account SID in Auth Token
4. Kupi telefonsko številko

---

### 12. **Slack** (Notifications)
```bash
# .env
SLACK_ESCALATION_WEBHOOK_URL="https://hooks.slack.com/services/..."
SLACK_ALERTS_WEBHOOK_URL="https://hooks.slack.com/services/..."
```
**Navodila:**
1. V Slacku: Settings & administration → Manage apps
2. Search "Incoming Webhooks"
3. Add to channel → Copy webhook URL

---

### 13. **Salesforce** (CRM)
```bash
# .env
SALESFORCE_CLIENT_ID="..."
SALESFORCE_CLIENT_SECRET="..."
```
**Navodila:**
1. Salesforce Setup → App Manager
2. New Connected App
3. Enable OAuth Settings
4. Kopiraj Consumer Key in Secret

---

### 14. **Sentry** (Error Tracking)
```bash
# .env
SENTRY_DSN="https://xxx@xxx.ingest.sentry.io/xxx"
```
**Navodila:**
1. Odpri https://sentry.io
2. Create Project → Next.js
3. Kopiraj DSN iz settings

---

### 15. **Vercel** (Deploy)
```bash
# .env
VERCEL_TOKEN="..."
```
**Navodila:**
1. Odpri https://vercel.com/account/tokens
2. "Create" → Copy token

---

## 🚀 Hitri Start

### 1. Preveri .env
```bash
# Odpri .env in izpolni vsaj:
STRIPE_SECRET_KEY="sk_test_..."
OPENAI_API_KEY="sk-..."
UPSTASH_REDIS_REST_URL="https://..."
BRAVE_API_KEY="..."
```

### 2. Restartaj Cursor
```
Cursor → Settings → MCP → Reload MCP Servers
```

### 3. Testiraj MCP-je
V Cursor Chat (Cmd+L) napiši:
```
Preveri če so vsi MCP serverji aktivni z: /mcp list
```

### 4. Testiraj Stripe MCP
```
Ustvari nov Stripe produkt z imenom "Test Product" in ceno $10
```

### 5. Testiraj Redis MCP
```
Shrani "test" v Redis pod ključem "agentflow:test" in nato preberi vrednost
```

---

## 📊 Kaj Mi Omogočajo Ti MCP-ji?

### Za AgentFlow Pro Platformo

| Funkcionalnost | MCP-ji |
|---------------|--------|
| **Workflow Execution** | `postgres`, `redis`, `time` |
| **Agent Memory** | `memory`, `qdrant`, `postgres` |
| **Research Agent** | `firecrawl`, `brave-search`, `context7` |
| **Content Agent** | `openai`, `google-ai`, `everart` |
| **Code Agent** | `github`, `git`, `filesystem` |
| **Deploy Agent** | `vercel`, `docker`, `cloudflare` |
| **Payment System** | `stripe` |
| **Email Notifications** | `resend` |
| **SMS Alerts** | `twilio` |
| **Real-time Updates** | `pusher` |
| **Error Monitoring** | `sentry` |
| **Team Notifications** | `slack` |
| **CRM Sync** | `salesforce` |

---

## 🔧 Troubleshooting

### MCP se ne naloži
```
1. Cursor → Settings → MCP → Preveri če je server viden
2. Restartaj Cursor
3. Preveri .env spremenljivke
```

### "Tool not found" error
```
1. Preveri če je MCP v .cursor/mcp.json
2. Preveri če je API ključ pravilen
3. Poskusi: npx -y <package-name> ročno v terminalu
```

### Env placeholder se ne razreši
```
1. Preveri če je spremenljivka v .env
2. Cursor bere .env iz project root
3. Restartaj Cursor
```

---

## 📈 Naslednji Koraki

1. **Izpolni .env** z vsaj osnovnimi API ključi (Stripe, OpenAI, Redis)
2. **Testiraj vsak MCP** posebej
3. **Ustvari prvi workflow** ki uporablja več MCP-jev
4. **Dokumentiraj** uporabo MCP-jev v tvojih agentih

---

## 💡 Pro Tips

1. **Stripe MCP** ti omogoča kreiranje produktov, cen, customerjev, invoice-ov direktno iz chata
2. **Redis MCP** je kritičen za rate limiting in session storage
3. **Brave Search** daje boljše rezultate za research agente kot Google
4. **Qdrant** omogoča semantic search po tvojem knowledge graph-u
5. **Sequential Thinking** pomaga kompleksnim agentom pri odločanju

---

**🎯 Cilj:** AgentFlow Pro bo imel najbolj zmogljivo MCP konfiguracijo med vsemi AI platformami!
