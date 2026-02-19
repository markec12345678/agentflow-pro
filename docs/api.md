# AgentFlow Pro Public API

Use the Public API to generate content from external systems. Authenticate with an API key created in Settings → Public API Keys.

## Authentication

Include your API key in the Authorization header:

```
Authorization: Bearer afp_your_api_key_here
```

## Endpoints

### POST /api/v1/generate

Generate blog content for a topic.

**Request:** `{ "topic": "How to optimize React performance" }`

**Response:** `{ "topic", "title", "content", "keywords" }`

**Example (curl):**

```bash
curl -X POST https://your-app.vercel.app/api/v1/generate \
  -H "Authorization: Bearer afp_your_api_key" \
  -H "Content-Type: application/json" \
  -d '{"topic": "How to optimize React performance"}'
```

## Rate Limiting

60 requests per minute per API key. When exceeded, returns `429` with `Retry-After` header.

## Errors

- 401: Invalid or missing API key
- 400: Missing required field (e.g. topic)
- 429: Rate limit exceeded (Retry-After header indicates seconds to wait)
- 500: Server error

---

## Tourism API

Tourism Hub endpointe uporabljajo session cookie (dashboard) ali Bearer token. Glej [TOURISM-API.md](TOURISM-API.md) za popolno referenco.

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/tourism/generate-content` | POST | Generira turistično vsebino |
| `/api/tourism/generate-email` | POST | Gostinski emaili |
| `/api/tourism/generate-landing` | POST | Landing page vsebina |
| `/api/tourism/landing-pages` | GET, POST | Seznam, ustvarjanje landing strani |
| `/api/tourism/landing-pages/[id]` | GET, PATCH, DELETE | CRUD posamezne strani |
| `/api/tourism/properties` | GET, POST | Seznam, ustvarjanje nastanitev |
| `/api/tourism/properties/[id]` | GET, PATCH, DELETE | CRUD posamezne nastanitve |
| `/api/user/templates` | GET, POST | Seznam, ustvarjanje template-ov |
| `/api/user/templates/[id]` | GET, PATCH, DELETE | CRUD posameznega template-a |
| `/api/tourism/batch-translate` | POST | Batch prevod v več jezikov |
