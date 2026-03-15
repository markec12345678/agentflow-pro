# LangSmith – Debugging in optimizacija agentov (Blok C #11)

LangSmith omogoča sledenje trace-ov klicov LLM in LangChain/LangGraph operacij.

## Zahteve

- Račun na [smith.langchain.com](https://smith.langchain.com)
- API ključ

## Omogočanje

Dodaj v `.env` / Vercel env vars:

```
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=lsv2_pt_...
```

Opcijsko:

- `LANGSMITH_PROJECT=agentflow-pro` – ime projekta v LangSmith
- `LANGCHAIN_CALLBACKS_BACKGROUND=true` – za Node.js (ne serverless)
- `LANGCHAIN_CALLBACKS_BACKGROUND=false` – za Vercel/serverless (tracing pred koncem)

## Uporaba

Ko sta `LANGSMITH_TRACING=true` in `LANGSMITH_API_KEY` nastavljena, LangChain in LangGraph avtomatsko logirajo trace-e. Ni potrebnih sprememb v kodi.

Projekt uporablja:

- `@langchain/core` – že vključuje LangSmith support
- `@langchain/langgraph` – workflow tracing

## Alternativa

Če ne uporabljate LangSmith:

- **Sentry** – error tracking (že integracija v projektu)
- Lastna tračna struktura – logiranje agent run-ov v DB ali log strežnik
