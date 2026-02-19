# Tourism API – Referenca za Developerje

API reference za Tourism Hub endpointe. Avtentikacija: session cookie (dashboard) ali Bearer token (glej [api.md](api.md)).

---

## Avtentikacija

- **Dashboard:** Session cookie (`next-auth.session-token`) – pridobljen po prijavi
- **Programski dostop:** `Authorization: Bearer <api_key>` – API ključ iz Settings → Public API Keys

---

## Endpoints

### POST /api/tourism/generate-content

Generira turistično vsebino (Booking.com, Airbnb, vodič, sezonska kampanja, Instagram).

**Request:**
```json
{
  "topic": "Napiši Booking.com opis za apartma v Bela Krajini...",
  "prompt": "..." // alternativa za topic
}
```

**Response (200):**
```json
{
  "success": true,
  "posts": [
    {
      "title": "Mock Tourism Content",
      "excerpt": "...",
      "fullContent": "..."
    }
  ]
}
```

**Napake:**
- 401 – Ni prijavljen
- 400 – Manjka `topic` ali `prompt`
- 503 – Ni OPENAI_API_KEY (dodaj v Settings)

**Mock mode:** `MOCK_MODE=true` vrne `[MOCK] Generirana turistična vsebina...`

---

### POST /api/tourism/generate-email

Generira gostinski email iz prompta (spremenljivke se substituirajo na strani ali serverju).

**Request:**
```json
{
  "prompt": "Napiši welcome email. Jezik: {jezik}. Nastanitev: {name}, {location}.",
  "variables": {
    "jezik": "sl",
    "name": "Apartma Kolpa",
    "location": "Bela Krajina"
  }
}
```

**Response (200):**
```json
{
  "content": "Subject: Dobrodošlica – Apartma Kolpa\n\n..."
}
```

**Napake:**
- 401 – Ni prijavljen
- 400 – Manjka `prompt`
- 503 – Ni OPENAI_API_KEY

**Mock mode:** Vrne `[MOCK] Pošiljatelj: AgentFlow Pro...`

---

### POST /api/tourism/batch-translate

Prevede vsebino v več ciljnih jezikov. Podprti jeziki: `sl`, `en`, `de`, `it`, `hr`.

**Request:**
```json
{
  "content": "Dobrodošli v apartmaju. Idealno za družinske počitnice.",
  "sourceLang": "sl",
  "targetLangs": ["en", "de", "it", "hr"]
}
```

**Response (200):**
```json
{
  "jobId": "clx...",
  "translations": {
    "en": "Welcome to the apartment...",
    "de": "Willkommen in der Wohnung...",
    "it": "Benvenuti nell'appartamento...",
    "hr": "Dobrodošli u apartmanu..."
  }
}
```

**Napake:**
- 401 – Ni prijavljen
- 400 – Manjka `content` ali `targetLangs` (prazno ali neveljavno)
- 503 – Ni OPENAI_API_KEY

**Curl primer:**
```bash
curl -X POST http://localhost:3000/api/tourism/batch-translate \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -d '{"content":"Dobrodošli v apartmaju.","sourceLang":"sl","targetLangs":["en","de"]}'
```

**Mock mode:** Vrne `[MOCK en] ...`, `[MOCK de] ...` za vsak jezik.

---

### POST /api/tourism/generate-landing

Generira landing page vsebino po predlogi in form data. Predloge: `tourism-basic`, `luxury-retreat`, `family-friendly`.

**Request:**
```json
{
  "template": "tourism-basic",
  "formData": {
    "name": "Apartma Kolpa",
    "location": "Bela Krajina",
    "type": "apartma",
    "capacity": "4",
    "features": "WiFi, parkirišče",
    "priceFrom": "65"
  },
  "languages": ["sl", "en"]
}
```

**Response (200):**
```json
{
  "success": true,
  "pages": {
    "sl": {
      "sections": {
        "hero": { "heading": "Dobrodošli v Apartma Kolpa", "body": "...", "items": [] },
        "about": { "heading": "O nas", "body": "...", "items": [] },
        "rooms": { "heading": "Nastanitve", "body": "...", "items": ["WiFi", "Parkirišče", "..."] },
        "amenities": { "heading": "Posebnosti", "body": "...", "items": [] },
        "cta": { "heading": "Rezervirajte zdaj", "body": "Cene od 65€/noč", "items": [] }
      },
      "seoTitle": "Apartma Kolpa | Bela Krajina",
      "seoDescription": "Odkrijte Apartma Kolpa v Bela Krajini."
    },
    "en": { ... }
  }
}
```

**Napake:**
- 401 – Ni prijavljen
- 400 – Neveljavna predloga (uporabi eno od: tourism-basic, luxury-retreat, family-friendly)

---

### GET /api/tourism/landing-pages

Seznam shranjenih landing strani za uporabnika.

**Query params (opcijsko):**
- `propertyId` – filtriraj po property

**Response (200):**
```json
{
  "pages": [
    {
      "id": "clx...",
      "title": "Apartma Kolpa",
      "slug": "apartma-kolpa",
      "content": { "sl": { "sections": {...}, "seoTitle": "...", "seoDescription": "..." }, "en": {...} },
      "template": "tourism-basic",
      "languages": ["sl", "en"],
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Napake:** 401 – Ni prijavljen

---

### POST /api/tourism/landing-pages

Ustvari novo landing stran.

**Request:**
```json
{
  "title": "Apartma Kolpa",
  "slug": "apartma-kolpa",
  "content": { "sl": {...}, "en": {...} },
  "template": "tourism-basic",
  "languages": ["sl", "en"],
  "seoTitle": "Apartma Kolpa | Bela Krajina",
  "seoDescription": "Odkrijte...",
  "propertyId": null
}
```

**Response (200):** `{ "page": { ... } }`

**Napake:**
- 401 – Ni prijavljen
- 400 – Manjka `title` ali `content`

---

### GET /api/tourism/landing-pages/[id]

Pridobi eno landing stran.

**Response (200):** `{ "page": { ... } }`

**Napake:** 401, 404 – Ni prijavljen, stran ne obstaja

---

### PATCH /api/tourism/landing-pages/[id]

Posodobi landing stran.

**Request (body):** `title`, `slug`, `content`, `template`, `languages`, `seoTitle`, `seoDescription`, `isPublished`, `publishedUrl` – vsi opcijski

**Response (200):** `{ "page": { ... } }`

**Napake:** 401, 404

---

### DELETE /api/tourism/landing-pages/[id]

Izbriši landing stran.

**Response (200):** `{ "success": true }`

**Napake:** 401, 404

---

### GET /api/tourism/properties

Seznam nastanitev (properties) za uporabnika.

**Response (200):**
```json
{
  "properties": [
    {
      "id": "clx...",
      "name": "Apartma Kolpa",
      "location": "Bela Krajina",
      "type": "apartma",
      "capacity": 4,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Napake:** 401 – Ni prijavljen

---

### POST /api/tourism/properties

Ustvari novo nastanitev.

**Request:**
```json
{
  "name": "Apartma Kolpa",
  "location": "Bela Krajina",
  "type": "apartma",
  "capacity": 4
}
```

**Response (200):** `{ "id", "name", "location", "type", "capacity", ... }`

**Napake:**
- 401 – Ni prijavljen
- 400 – Manjka `name`

---

### GET /api/tourism/properties/[id]

Pridobi eno nastanitev.

**Response (200):** `{ "id", "name", "location", "type", "capacity", ... }`

**Napake:** 401, 404

---

### PATCH /api/tourism/properties/[id]

Posodobi nastanitev.

**Request (body):** `name`, `location`, `type`, `capacity` – vsi opcijski

**Response (200):** `{ ... }`

**Napake:** 401, 404

---

### DELETE /api/tourism/properties/[id]

Izbriši nastanitev.

**Response (200):** `{ "ok": true }`

**Napake:** 401, 404

---

### GET /api/user/templates

Seznam template-ov za uporabnika. Uporablja se za Tourism Hub in druge kategorije.

**Query params:**
- `category` – filtriraj (npr. `tourism`)
- `propertyId` – filtriraj po nastanitvi

**Response (200):** `{ "templates": [...] }`

**Napake:** 401

---

### POST /api/user/templates

Ustvari nov template.

**Request:**
```json
{
  "name": "Moja nastanitev",
  "category": "tourism",
  "basePrompt": "booking-description",
  "customVars": { "lokacija": "Bela Krajina", "tip": "apartma" },
  "propertyId": null
}
```

**Response (200):** `{ "template": { ... } }`

**Napake:** 401, 400 (manjka name/category/basePrompt)

---

### GET /api/user/templates/[id]

Pridobi en template.

**Response (200):** `{ "template": { ... } }`

**Napake:** 401, 404

---

### PATCH /api/user/templates/[id]

Posodobi template (name, customVars, content, language, isPublic).

**Response (200):** `{ "template": { ... } }`

**Napake:** 401, 404

---

### DELETE /api/user/templates/[id]

Izbriši template.

**Response (200):** `{ "success": true }`

**Napake:** 401, 404

---

### GET /api/tourism/seo-metrics

Vrne SEO metrike (keyworde) za trenutnega uporabnika.

**Response (200):**
```json
{
  "metrics": [
    {
      "id": "clx...",
      "keyword": "apartmaji bela krajina",
      "position": 8,
      "searchVolume": 320,
      "difficulty": 35,
      "lastChecked": "2025-02-18T..."
    }
  ]
}
```

**Napake:**
- 401 – Ni prijavljen

Če uporabnik nima metrik, vrne `{ "metrics": [] }`. SEO Dashboard uporabi mock podatke, če je seznam prazen.
