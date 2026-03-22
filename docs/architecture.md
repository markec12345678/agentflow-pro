# 🏗️ Architecture Documentation

## System Overview

AgentFlow Pro is a **multi-agent AI platform** built with Next.js 15, designed for tourism and hospitality automation.

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Web UI  │  │ Dashboard│  │  Mobile  │  │   API    │   │
│  │ (Next.js)│  │  (React) │  │   (PWA)  │  │ Clients  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Next.js App Router                       │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐       │  │
│  │  │  Auth  │ │Properties│ │Reservation│ │ AI Agents │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Agents  │  │Workflows │  │Analytics │  │ Tourism  │   │
│  │  System  │  │  Engine  │  │ Service  │  │ Services │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                                │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │PostgreSQL│  │  Redis   │  │   Memory │  │ External │   │
│  │(Supabase)│  │ (Cache)  │  │  Graph   │  │   APIs   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 19** - UI library
- **TypeScript 5** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library

### Backend
- **Next.js API Routes** - RESTful API
- **Prisma 7** - ORM
- **PostgreSQL** - Database (Supabase/Neon)
- **Redis** - Caching
- **NextAuth** - Authentication

### AI/ML
- **OpenAI** - LLM provider
- **Firecrawl** - Web scraping
- **Context7** - API documentation
- **Custom Agents** - 8 specialized agents

### Infrastructure
- **Vercel** - Deployment
- **Supabase** - Database
- **Sentry** - Error tracking
- **k6** - Load testing

## Database Schema

### Core Models

```prisma
User
├── id: String @id @default(cuid())
├── email: String @unique
├── name: String?
├── role: UserRole @default(VIEWER)
├── properties: Property[]
└── reservations: Reservation[]

Property
├── id: String @id @default(cuid())
├── name: String
├── location: String?
├── type: String? (hotel, apartment, camp, farm)
├── basePrice: Float?
├── currency: String @default("EUR")
├── userId: String?
├── reservations: Reservation[]
└── ajpesConnection: AjpesConnection?

Reservation
├── id: String @id @default(cuid())
├── propertyId: String
├── guestId: String
├── checkIn: DateTime
├── checkOut: DateTime
├── guests: Int
├── status: String (confirmed, pending, cancelled)
├── totalPrice: Float
├── eturizemSubmittedAt: DateTime?
└── guest: Guest

Guest
├── id: String @id @default(cuid())
├── name: String
├── email: String
├── phone: String?
├── country: String
└── reservations: Reservation[]
```

### Tourism-Specific Models

```prisma
AjpesConnection
├── id: String @id @default(cuid())
├── propertyId: String @unique
├── username: String (encrypted)
├── password: String (encrypted)
├── rnoId: Int
└── property: Property

GuestCommunication
├── id: String @id @default(cuid())
├── propertyId: String
├── guestId: String
├── type: String (pre-arrival, during-stay, post-departure)
├── message: String
├── sentAt: DateTime
└── status: String

FaqResponseLog
├── id: String @id @default(cuid())
├── propertyId: String
├── question: String
├── answer: String
├── source: String (manual, ai-generated)
└── createdAt: DateTime
```

## AI Agent Architecture

### Agent Orchestrator

```
┌─────────────────────────────────────┐
│        Orchestrator                 │
│  ┌───────────────────────────────┐ │
│  │  Agent Registry               │ │
│  │  - Research Agent             │ │
│  │  - Content Agent              │ │
│  │  - Code Agent                 │ │
│  │  - Deploy Agent               │ │
│  │  - Communication Agent        │ │
│  │  - Personalization Agent      │ │
│  │  - Reservation Agent          │ │
│  │  - Optimization Agent         │ │
│  └───────────────────────────────┘ │
│         │                          │
│  ┌──────▼──────┐                  │
│  │ Task Queue  │                  │
│  └─────────────┘                  │
└─────────────────────────────────────┘
```

### Agent Communication Protocol

```typescript
interface AgentMessage {
  id: string;
  type: 'request' | 'response' | 'error';
  agentId: string;
  payload: any;
  timestamp: Date;
}

interface AgentResult {
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
  tokensUsed: number;
  costUsd: number;
}
```

## API Architecture

### Route Structure

```
/api/
├── auth/              # Authentication
│   ├── signin/
│   ├── signout/
│   └── callback/
├── tourism/           # Tourism endpoints
│   ├── properties/
│   ├── reservations/
│   ├── guests/
│   ├── eturizem/
│   └── ical/
├── agents/            # AI agents
│   ├── research/
│   ├── content/
│   └── communication/
├── workflows/         # Workflow automation
│   ├── execute/
│   └── templates/
└── analytics/         # Analytics
    ├── dashboard/
    └── reports/
```

### Authentication Flow

```
1. User submits credentials
        ↓
2. NextAuth validates
        ↓
3. JWT token generated
        ↓
4. Session cookie set
        ↓
5. Protected routes check cookie
        ↓
6. API requests include session
```

## Security

### Authentication
- **NextAuth.js** with JWT strategy
- **Session cookies** (httpOnly, secure)
- **CSRF protection** on state-changing requests
- **Rate limiting** on API endpoints

### Data Protection
- **AES-256-GCM** encryption for sensitive data
- **Environment variables** for secrets
- **Input validation** with Zod schemas
- **SQL injection prevention** via Prisma ORM

### Access Control
- **Role-based access control (RBAC)**
- **Property-level permissions**
- **Team collaboration** with granular roles

## Deployment

### Vercel Configuration

```json
{
  "buildCommand": "prisma migrate deploy && next build",
  "outputDirectory": ".next",
  "devCommand": "next dev",
  "installCommand": "npm install"
}
```

### Environment Variables

**Required:**
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

**Optional:**
- `REDIS_URL`
- `OPENAI_API_KEY`
- `FIRECRAWL_API_KEY`
- `SENTRY_DSN`

## Monitoring

### Error Tracking
- **Sentry** for error reporting
- **Custom error codes** (e.g., ETURIZEM_001-006)
- **Retry logic** for transient failures

### Performance
- **Redis caching** for API responses
- **Database indexing** on frequently queried fields
- **Lazy loading** for heavy components
- **Image optimization** via Next.js Image

### Analytics
- **Agent run tracking** (duration, tokens, cost)
- **Content generation metrics** (word count, quality)
- **User session analytics** (pages, features, device)
- **Conversion funnel** (visit → signup → subscription)

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (Playwright)
      /----\    
     /      \   Integration Tests
    /--------\  
   /          \ Unit Tests (Vitest)
  /------------\
```

### Test Coverage Goals
- **Unit Tests:** 80%+ coverage
- **Integration Tests:** Critical paths
- **E2E Tests:** Key user flows

## Scalability

### Horizontal Scaling
- **Stateless API design**
- **Redis for session storage**
- **Database connection pooling**
- **CDN for static assets**

### Vertical Scaling
- **Serverless functions** (Vercel)
- **Auto-scaling** based on demand
- **Database read replicas**

### Performance Optimization
- **Code splitting** for smaller bundles
- **Server-side rendering** for SEO
- **Incremental static regeneration**
- **Edge functions** for low latency

---

**Last Updated:** March 2026
**Version:** 1.0.0
