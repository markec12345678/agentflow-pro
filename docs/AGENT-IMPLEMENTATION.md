# 🤖 Agent Implementation - Research & Content Agents

**Datum:** 18. Marec 2026  
**Status:** ✅ Implementirano  
**JetBrains Task:** ✓ IZPOLNJENO

---

## 📊 POVZETEK

Implementirana dva glavna AI agenta z dejansko funkcionalnostjo:

1. **ResearchAgent** - Web research z Firecrawl in Brave Search
2. **ContentAgent** - Content generation z OpenAI GPT-4
3. **API Routes** - Tourism endpoints (Properties, Reservations)

---

## 🔍 RESEARCH AGENT

### Datoteka
`src/agents/research/ResearchAgent.ts` (500+ vrstic)

### Funkcionalnosti

| Feature | Opis | Status |
|---------|------|--------|
| **Web Research** | Iskanje po spletu z Brave Search API | ✅ |
| **Web Scraping** | Strganje vsebine s Firecrawl | ✅ |
| **Competitor Analysis** | Analiza konkurence | ✅ |
| **SEO Research** | Raziskava ključnih besed | ✅ |
| **Market Research** | Tržne raziskave | ✅ |
| **Summarization** | Povzemanje rezultatov | ✅ |

### Uporabljene Knjižnice

```typescript
import FirecrawlApp from 'firecrawl';
// Brave Search via fetch API
```

### API Ključi

```bash
# .env
FIRECRAWL_API_KEY="fc-xxx"
BRAVE_API_KEY="xxx"
```

### Primer Uporabe

```typescript
import { createResearchAgent } from '@/agents/research/ResearchAgent';

const agent = createResearchAgent();

const result = await agent.execute({
  query: 'best hotels in Ljubljana',
  type: 'competitor',
  limit: 10,
  depth: 'medium',
  context: {
    industry: 'tourism',
    location: 'Slovenia',
  },
});

console.log(result);
// {
//   success: true,
//   results: [...],
//   summary: "...",
//   metadata: { sources: 10, timeMs: 1234, confidence: 0.85 }
// }
```

### Tipi Raziskav

```typescript
type ResearchType = 'web' | 'competitor' | 'seo' | 'market';
```

### Response Structure

```typescript
interface ResearchResult {
  success: boolean;
  query: string;
  results: SearchResult[];
  summary?: string;
  metadata: {
    sources: number;
    timeMs: number;
    confidence: number;
  };
  error?: string;
}
```

---

## 📝 CONTENT AGENT

### Datoteka
`src/agents/content/ContentAgent.ts` (600+ vrstic)

### Funkcionalnosti

| Feature | Opis | Status |
|---------|------|--------|
| **Hotel Descriptions** | Opisi hotelov in nastanitev | ✅ |
| **Room Descriptions** | Opisi sob | ✅ |
| **Blog Posts** | SEO blog članki | ✅ |
| **Landing Pages** | Konverzijsko usmerjene strani | ✅ |
| **Emails** | Email kampanje | ✅ |
| **Social Media** | Social media vsebine | ✅ |
| **Multi-language** | 20+ jezikov | ✅ |
| **SEO Optimization** | Meta tagi, ključne besede | ✅ |

### Uporabljene Knjižnice

```typescript
import OpenAI from 'openai';
// Google Gemini (fallback) via fetch API
```

### API Ključi

```bash
# .env
OPENAI_API_KEY="sk-xxx"
GEMINI_API_KEY="xxx"  # Fallback
```

### Primer Uporabe

```typescript
import { createContentAgent } from '@/agents/content/ContentAgent';

const agent = createContentAgent();

const result = await agent.execute({
  type: 'hotel-description',
  topic: 'Luxury boutique hotel in Lake Bled',
  context: {
    propertyName: 'Hotel Bled',
    location: 'Bled, Slovenia',
    propertyType: 'hotel',
    uniqueSellingPoints: ['lake view', 'spa', 'fine dining'],
    amenities: ['WiFi', 'Pool', 'Restaurant', 'Spa'],
  },
  tone: 'luxurious',
  length: 'medium',
  language: 'en',
  keywords: ['luxury', 'boutique', 'lake view'],
});

console.log(result.content);
// "Nestled on the shores of picturesque Lake Bled..."
```

### Tipi Vsebin

```typescript
type ContentType =
  | 'hotel-description'
  | 'room-description'
  | 'blog-post'
  | 'landing-page'
  | 'email'
  | 'social-media'
  | 'meta-description'
  | 'faq'
  | 'destination-guide';
```

### Tone Options

```typescript
type ContentTone =
  | 'professional'
  | 'friendly'
  | 'luxurious'
  | 'casual'
  | 'enthusiastic'
  | 'informative';
```

### Response Structure

```typescript
interface ContentGenerationResponse {
  success: boolean;
  content: string;
  metadata: {
    type: ContentType;
    wordCount: number;
    readingTimeMinutes: number;
    language: string;
    tone: ContentTone;
    generatedAt: Date;
  };
  seo?: {
    keywords: string[];
    metaTitle?: string;
    metaDescription?: string;
    slug?: string;
  };
  alternatives?: string[];
  error?: string;
}
```

---

## 🌐 API ROUTES

### Properties Endpoint

**Datoteka:** `src/app/api/v1/tourism/properties/route.ts`

#### GET /api/v1/tourism/properties

```bash
curl http://localhost:3000/api/v1/tourism/properties?page=1&limit=20&type=hotel&city=Ljubljana
```

**Query Parameters:**
- `page` (default: 1)
- `limit` (max: 100, default: 20)
- `type` (hotel, resort, apartment, villa, guesthouse, hostel)
- `city`
- `isActive` (boolean)
- `search` (full-text search)
- `sortBy` (name, createdAt, updatedAt, starRating)
- `sortOrder` (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasMore": true
  },
  "meta": {
    "executionTimeMs": 45,
    "timestamp": "2026-03-18T..."
  }
}
```

#### POST /api/v1/tourism/properties

```bash
curl -X POST http://localhost:3000/api/v1/tourism/properties \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Hotel Bled",
    "type": "hotel",
    "description": "Luxury hotel...",
    "address": {
      "street": "Cesta svobode 1",
      "city": "Bled",
      "postalCode": "4260",
      "country": "Slovenia"
    },
    "starRating": 5,
    "roomCount": 50,
    "isActive": true
  }'
```

**Validation:**
- `name`: required, min 1, max 255
- `type`: required, enum
- `description`: min 10 characters
- `address`: required object
- `starRating`: 1-5
- `priceRange`: optional object

### Reservations Endpoint

**Datoteka:** `src/app/api/v1/tourism/reservations/route.ts`

#### GET /api/v1/tourism/reservations

```bash
curl http://localhost:3000/api/v1/tourism/reservations?status=confirmed&checkInFrom=2026-04-01
```

**Query Parameters:**
- `page`, `limit`
- `propertyId` (UUID)
- `status` (pending, confirmed, checked_in, checked_out, cancelled, no_show)
- `paymentStatus` (pending, paid, partial, refunded, failed)
- `checkInFrom`, `checkInTo`
- `search` (guest name, email)
- `sortBy` (checkIn, checkOut, createdAt, totalPrice)

#### POST /api/v1/tourism/reservations

```bash
curl -X POST http://localhost:3000/api/v1/tourism/reservations \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "uuid",
    "roomId": "uuid",
    "checkIn": "2026-04-01",
    "checkOut": "2026-04-05",
    "totalPrice": 500,
    "currency": "EUR",
    "guestInfo": {
      "firstName": "John",
      "lastName": "Doe",
      "email": "john@example.com"
    },
    "status": "confirmed"
  }'
```

**Validation:**
- `propertyId`, `roomId`: required UUID
- `checkIn`, `checkOut`: required dates (checkOut > checkIn)
- `totalPrice`: positive number
- `guestInfo`: required or guestId
- Availability check: preveri če je soba prosta

---

## 🛡️ ERROR HANDLING

### Standardizirana Struktura

```typescript
interface ApiError {
  error: string;        // "Validation Error"
  message: string;      // "Invalid property data"
  code: string;         // "INVALID_BODY"
  details?: any;        // Zod error details
}
```

### HTTP Status Codes

| Code | Pomen | Primer |
|------|-------|--------|
| **200** | Success | GET uspešen |
| **201** | Created | POST uspešen |
| **400** | Bad Request | Validation error |
| **404** | Not Found | Property not found |
| **409** | Conflict | Duplicate name |
| **500** | Internal Error | Database error |

### Zod Validation

```typescript
const PropertyCreateSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  type: z.enum(['hotel', 'resort', 'apartment', 'villa']),
  // ...
});

const result = PropertyCreateSchema.safeParse(body);

if (!result.success) {
  return createErrorResponse(
    'Validation Error',
    'Invalid property data',
    'INVALID_BODY',
    result.error.flatten()
  );
}
```

---

## 🔗 INTEGRACIJA Z ORCHESTRATORJEM

### Agent Registry

```typescript
// src/agents/registry.ts
import { createResearchAgent } from './research/ResearchAgent';
import { createContentAgent } from './content/ContentAgent';

export class AgentRegistry {
  private static agents = new Map<string, Agent>();

  static initialize(): void {
    this.agents.set('research', createResearchAgent());
    this.agents.set('content', createContentAgent());
    // ... drugi agenti
  }

  static getAgent(type: string): Agent | undefined {
    return this.agents.get(type);
  }
}
```

### Orchestration Example

```typescript
import { AgentOrchestrator } from '@/agents/orchestrator';
import { createResearchAgent } from './research/ResearchAgent';
import { createContentAgent } from './content/ContentAgent';

const orchestrator = new AgentOrchestrator();

// Add agents
orchestrator.addAgent(createResearchAgent());
orchestrator.addAgent(createContentAgent());

// Execute workflow
const workflow = {
  id: 'content-creation-001',
  name: 'Content Creation Workflow',
  agentIds: ['research', 'content'],
  config: {
    research: {
      query: 'best hotels in Bled',
      type: 'market',
    },
    content: {
      type: 'blog-post',
      topic: 'Top 10 Hotels in Lake Bled',
    },
  },
};

const result = await orchestrator.executeWorkflow(workflow);
```

---

## 📦 NAMESTITEV

### Nameščeni Paketi

```bash
npm install openai firecrawl --legacy-peer-deps
```

### Environment Variables

```bash
# .env

# Research Agent
FIRECRAWL_API_KEY="fc-xxx"
BRAVE_API_KEY="xxx"

# Content Agent
OPENAI_API_KEY="sk-xxx"
GEMINI_API_KEY="xxx"  # Fallback
```

---

## 🧪 TESTIRANJE

### Research Agent Test

```typescript
import { createResearchAgent } from '@/agents/research/ResearchAgent';

describe('ResearchAgent', () => {
  it('should perform web research', async () => {
    const agent = createResearchAgent();
    
    const result = await agent.execute({
      query: 'AI in tourism 2026',
      type: 'web',
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.results).toBeDefined();
    expect(result.metadata.sources).toBeGreaterThan(0);
  });

  it('should perform competitor analysis', async () => {
    const agent = createResearchAgent();
    
    const result = await agent.execute({
      query: 'online booking platforms',
      type: 'competitor',
      context: {
        industry: 'tourism',
        location: 'Europe',
      },
    });

    expect(result.success).toBe(true);
    expect(JSON.parse(result.summary!)).toHaveProperty('competitors');
  });
});
```

### Content Agent Test

```typescript
import { createContentAgent } from '@/agents/content/ContentAgent';

describe('ContentAgent', () => {
  it('should generate hotel description', async () => {
    const agent = createContentAgent();
    
    const result = await agent.execute({
      type: 'hotel-description',
      topic: 'Boutique hotel in Ljubljana',
      context: {
        propertyName: 'Hotel Ljubljana',
        location: 'Ljubljana, Slovenia',
        uniqueSellingPoints: ['historic', 'luxury'],
      },
      tone: 'luxurious',
      length: 'medium',
    });

    expect(result.success).toBe(true);
    expect(result.content).toBeDefined();
    expect(result.metadata.wordCount).toBeGreaterThan(100);
  });

  it('should generate SEO metadata', async () => {
    const agent = createContentAgent();
    
    const result = await agent.execute({
      type: 'blog-post',
      topic: 'Best Slovenian Hotels',
      keywords: ['Slovenia', 'hotels', 'luxury'],
    });

    expect(result.seo).toBeDefined();
    expect(result.seo?.keywords).toHaveLength(10);
    expect(result.seo?.metaTitle).toBeDefined();
  });
});
```

### API Routes Test

```typescript
import { GET, POST } from '@/app/api/v1/tourism/properties/route';

describe('Properties API', () => {
  it('should list properties', async () => {
    const request = new NextRequest(
      new URL('http://localhost:3000/api/v1/tourism/properties?page=1&limit=10')
    );
    
    const response = await GET(request);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toBeDefined();
    expect(data.pagination).toBeDefined();
  });

  it('should create property', async () => {
    const body = {
      name: 'Test Hotel',
      type: 'hotel',
      address: {
        street: 'Test 1',
        city: 'Ljubljana',
        postalCode: '1000',
        country: 'Slovenia',
      },
    };

    const request = new NextRequest(
      new URL('http://localhost:3000/api/v1/tourism/properties'),
      {
        method: 'POST',
        body: JSON.stringify(body),
      }
    );
    
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('Test Hotel');
  });
});
```

---

## ✅ CHECKLIST

### Research Agent
- [x] Firecrawl integracija
- [x] Brave Search API
- [x] Web research
- [x] Competitor analysis
- [x] SEO research
- [x] Market research
- [x] Summarization
- [x] Error handling

### Content Agent
- [x] OpenAI GPT-4 integracija
- [x] Google Gemini fallback
- [x] 9 content types
- [x] 6 tone options
- [x] Multi-language support
- [x] SEO optimization
- [x] Alternative generation
- [x] Error handling

### API Routes
- [x] Properties GET/POST
- [x] Reservations GET/POST
- [x] Zod validation
- [x] Error handling standardization
- [x] Pagination
- [x] Filtering
- [x] Sorting

---

**🎯 JetBrains Task: ✅ IZPOLNJEN**

Vsi trije deli so implementirani:
1. ✅ ResearchAgent z Firecrawl in Brave Search
2. ✅ ContentAgent z OpenAI GPT-4
3. ✅ API routes z Zod validacijo in error handlingom
