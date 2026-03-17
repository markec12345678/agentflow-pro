# Preklop na prave agente (MOCK_MODE=false)

## Kdaj uporabiti

- **MOCK_MODE=true** (default): agenti vračajo mock podatke brez API klicev. Uporabno za lokalni razvoj brez API ključev.
- **MOCK_MODE=false**: agenti kličejo prave API-je (OpenAI, Firecrawl, Context7, GitHub).

## Zahteve za MOCK_MODE=false

Vsaj en od naslednjih ključev mora biti nastavljen:

| Env var | Namen |
|---------|-------|
| `OPENAI_API_KEY` | LLM za chat, content generiranje |
| `ALIBABA_QWEN_API_KEY` | Alternativa za LLM |
| `FIRECRAWL_API_KEY` | Research Agent – web scraping |
| `CONTEXT7_API_KEY` | API dokumentacije |
| `GITHUB_TOKEN` | Code Agent – PR, repo operacije |
| `SERPAPI_API_KEY` | Search (opcijsko) |

## Koraki

### 1. Lokalno (.env.local)

```env
MOCK_MODE="false"
OPENAI_API_KEY="sk-..."
FIRECRAWL_API_KEY="fc-..."
CONTEXT7_API_KEY="..."
GITHUB_TOKEN="ghp_..."
```

### 2. Vercel (Production)

Vercel Dashboard → Settings → Environment Variables:

- `MOCK_MODE` = `false` (Production)
- Dodaj vse potrebne API ključe (OPENAI_API_KEY, FIRECRAWL_API_KEY, CONTEXT7_API_KEY, GITHUB_TOKEN)

### 3. Redeploy

Po dodajanju env vars v Vercel: Deployments → Redeploy

### 4. Preveritev

- Odpri chat v aplikaciji – odgovori naj bodo pravi LLM odgovori, ne `[MOCK]`
- Research Agent – mora vrniti resnične rezultate iz Firecrawl

### 5. Uporabniški API ključi (Settings)

Uporabniki lahko v Settings vnesejo lastne OpenAI ključe. Če uporabnik doda ključ, se ta uporabi namesto globalnega OPENAI_API_KEY. Za multi-agent plan/execute so potrebni tudi Research/Content agenti – glej `.env.example` za FIRECRAWL_API_KEY, CONTEXT7_API_KEY, GITHUB_TOKEN.
