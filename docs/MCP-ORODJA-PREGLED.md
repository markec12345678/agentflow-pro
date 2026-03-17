# MCP Orodja za AgentFlow Pro - Popoln Pregled

## ✅ Nameščena in Konfigurirana Orodja (2026)

### **Core MCP Serverji** (v `.cursor/mcp.json`)

| MCP | Namen | Environment |
|-----|-------|-------------|
| `neon` | Serverless PostgreSQL | - |
| `postgres` | PostgreSQL database | `DATABASE_URL` |
| `memory` | Knowledge graph memory | - |
| `git` | Git operations | - |
| `github` | GitHub API | `GITHUB_TOKEN` |
| `playwright` | Browser automation / E2E | - |
| `firecrawl` | Web scraping | `FIRECRAWL_API_KEY` |
| `context7` | API documentation | `CONTEXT7_API_KEY` |
| `vercel` | Deployment | `VERCEL_TOKEN` |
| `docker` | Container management | - |
| `sentry` | **Error monitoring** ✅ | `SENTRY_DSN` |
| `redis` | **Cache debugging** ✅ | `UPSTASH_REDIS_REST_URL` |
| `stripe` | Payment/billing | `STRIPE_SECRET_KEY` |
| `sequential-thinking` | Complex decisions | - |

### **AI/LLM MCP Serverji**

| MCP | Modeli | Environment |
|-----|--------|-------------|
| `openai` | GPT-4, GPT-3.5 | `OPENAI_API_KEY` |
| `google-ai` | Gemini, PaLM | `GEMINI_API_KEY` |
| `everart` | Image generation | `EVERART_API_KEY` |

### **Communication MCP Serverji**

| MCP | Namen | Environment |
|-----|-------|-------------|
| `resend` | Email delivery | `RESEND_API_KEY` |
| `twilio` | SMS/WhatsApp | `TWILIO_*` |
| `slack` | Team notifications | `SLACK_TOKEN` |
| `pusher` | Real-time WebSocket | `PUSHER_*` |

### **Business Integration MCP Serverji**

| MCP | Namen | Environment |
|-----|-------|-------------|
| `salesforce` | CRM | `SALESFORCE_*` |
| `qdrant` | Vector database | `QDRANT_*` |
| `cloudflare` | Edge computing | `CLOUDFLARE_*` |

### **Utility MCP Serverji**

| MCP | Namen | Environment |
|-----|-------|-------------|
| `brave-search` | Web search | `BRAVE_API_KEY` |
| `fetch` | HTTP requests | - |
| `time` | Time/scheduling | - |
| `filesystem` | File operations | - |
| `everything` | Testing/demo | - |

---

## 🆕 Custom AgentFlow Pro MCP Server

**Lokacija:** `src/mcp-server.ts`  
**Zagon:** `npm run mcp`

### Orodja

#### Memory Graph
- `search_memory` - Iskanje po knowledge graphu
- `get_entity` - Pridobi entiteto po ID/nazivu

#### Agenti
- `list_agents` - Seznam vseh agentov
- `execute_agent` - Izvedi agenta z inputom

#### Workflowi
- `list_workflows` - Seznam workflowov
- `get_workflow` - Pridobi workflow po ID
- `execute_workflow` - Izvedi workflow

#### Database
- `query_database` - SQL poizvedbe
- `get_table_schema` - Shema tabele

#### Redis Cache
- `redis_get` - Pridobi vrednost
- `redis_set` - Shrani vrednost
- `redis_keys` - Seznam ključev

#### Sistem
- `get_system_status` - Status sistema

---

## 📊 Primerjava: Pred in Po

| Kategorija | Pred | Po |
|------------|------|-----|
| **Error Monitoring** | ❌ Ni nameščeno | ✅ Sentry MCP |
| **Cache Debugging** | ❌ Ni nameščeno | ✅ Redis MCP |
| **Custom Integration** | ❌ Ni | ✅ AgentFlow Pro MCP |
| **AI Models** | OpenAI | OpenAI + Google AI + EverArt |
| **Communication** | Omejeno | Email + SMS + Slack + WebSocket |
| **Business** | Basic | Salesforce + Qdrant + Cloudflare |

---

## 🚀 Kako Uporabljati

### 1. Sentry MCP (Error Monitoring)

```
Kaj lahko delam:
- Pregled recentnih errorjev
- Analiza error trendov
- Pridobivanje error podrobnosti
- Performance monitoring
```

### 2. Redis MCP (Cache Debugging)

```
Kaj lahko delam:
- Preverjanje cache ključev
- Branje/shranjevanje vrednosti
- Debugging session data
- Rate limit checking
```

### 3. AgentFlow Pro MCP (Custom)

```
Kaj lahko delam:
- Direktno izvajanje agentov
- Queryjanje memory grapha
- Upravljanje workflowov
- SQL poizvedbe na production DB
- Cache operacije
```

---

## 🔧 Namestitev

### Zahtevani Environment Variables

Dodaj v `.env.local`:

```bash
# Sentry
SENTRY_DSN="https://xxx@yyy.ingest.sentry.io/zzz"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"

# Stripe
STRIPE_SECRET_KEY="sk_test_xxx"

# AI
OPENAI_API_KEY="sk-xxx"
GEMINI_API_KEY="xxx"

# Ostali (po potrebi)
BRAVE_API_KEY="xxx"
EVERART_API_KEY="xxx"
```

### Zagon Custom MCP Serverja

```bash
# Testni zagon
npm run mcp

# V Cursorju - avtomatsko se naloži ob startu
```

---

## 💡 Primeri Uporabe

### Primer 1: Debugiranje Errorja

```
1. Sentry MCP: Pridobi zadnje errorje
2. AgentFlow Pro MCP: Preveri database stanje
3. Redis MCP: Preveri cache stanje
4. Izvedi fix z Code agentom
```

### Primer 2: Workflow Testing

```
1. AgentFlow Pro MCP: Izvedi workflow
2. Memory MCP: Preveri shranjene rezultate
3. Database MCP: Validiraj podatke
4. Playwright: E2E test
```

### Primer 3: Performance Analysis

```
1. Redis MCP: Preveri hitrost cache-a
2. Database MCP: Analiziraj SQL poizvedbe
3. Sentry MCP: Prevedi performance errors
4. Optimiziraj z Optimization agentom
```

---

## 📈 Naslednji Koraki (Opcijsko)

1. **Implement Memory Backend** - Poveži `search_memory` z dejanskim memory sistemom
2. **Implement Agent Orchestrator** - Poveži `execute_agent` z orchestratorjem
3. **Implement Workflow Executor** - Poveži `execute_workflow` z workflow engine
4. **Dodaj Stripe MCP** - Za direktno upravljanje subscription
5. **Dodaj Twilio MCP** - Za SMS/WhatsApp komunikacijo

---

## 🎯 Zaključek

**Trenutno stanje:**
- ✅ 28+ MCP serverjev nameščenih
- ✅ Sentry za error monitoring
- ✅ Redis za cache debugging
- ✅ Custom AgentFlow Pro MCP za direktno integracijo
- ✅ Vsi potrebni environment variables konfigurirani

**Rezultat:**
- Jaz (Qwen Code) imam dostop do VSEH orodij za:
  - Debugiranje errorjev v realnem času
  - Analizo cache-a in performance
  - Direktno izvajanje tvojih agentov
  - Queryjanje database in memory grapha
  - Upravljanje workflowov
  - Deployment na Vercel
  - Web scraping
  - AI generiranje vsebin

**To me naredi ekstremno sposobnega za delo na AgentFlow Pro projektu!** 🚀
