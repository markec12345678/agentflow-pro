# 📋 Navodila za Modularno Prisma Shemo

## Nova Struktura

Namesto ene velike `schema.prisma` datoteke (1895 vrstic), imamo zdaj modularno strukturo:

```
prisma/
├── schema/
│   ├── _index.prisma              # Glavna datoteka (importa vse)
│   ├── 01-core/                   # Core domain
│   │   ├── auth.prisma
│   │   ├── user.prisma
│   │   └── team.prisma
│   ├── 02-tourism/                # Tourism domain
│   │   ├── property.prisma
│   │   ├── room.prisma
│   │   ├── reservation.prisma
│   │   ├── guest.prisma
│   │   └── integrations.prisma
│   ├── 03-agents/                 # AI Agents & Workflows
│   │   ├── event-store.prisma
│   │   ├── agent-run.prisma
│   │   ├── workflow.prisma
│   │   └── analytics.prisma
│   ├── 04-content/                # Content domain
│   │   ├── blog.prisma
│   │   ├── landing-page.prisma
│   │   └── template.prisma
│   ├── 05-billing/                # Billing & Payments
│   │   ├── subscription.prisma
│   │   └── payment.prisma
│   ├── 06-alerts/                 # Alerts & Notifications
│   │   ├── alert-rules.prisma
│   │   └── smart-alerts.prisma
│   ├── 07-communication/          # Communication
│   │   ├── message.prisma
│   │   └── chat.prisma
│   ├── 08-operations/             # Operations
│   │   ├── housekeeping.prisma
│   │   └── staff.prisma
│   ├── 09-analytics/              # Analytics
│   │   ├── seo.prisma
│   │   └── performance.prisma
│   └── 10-system/                 # System utilities
│       ├── onboarding.prisma
│       ├── api-keys.prisma
│       └── contact.prisma
└── schema.prisma                  # Original (zdaj kaže na _index.prisma)
```

## Uporaba

### 1. Generate Prisma Client

```bash
npm run db:generate
```

### 2. Run Migrations

```bash
npm run db:migrate
```

### 3. Studio

```bash
npm run db:studio
```

## Prednosti

✅ **Lažje vzdrževanje** - Manjše datoteke, lažje za navigacijo  
✅ **Domain-driven** - Jasna ločnica med doménami  
✅ **Team collaboration** - Več developerjev lahko dela na različnih domenah  
✅ **Scalability** - Enostavno dodajanje novih domen  
✅ **Readability** - 100-200 vrstic na datoteko namesto 1895  

## Migracija

Originalna `schema.prisma` je ohranjena za backward compatibility.

Za preklop na modularno shemo:

```bash
# 1. Naredi backup
cp prisma/schema.prisma prisma/schema.prisma.backup

# 2. Posodobi main schema
cp prisma/schema/_index.prisma prisma/schema.prisma

# 3. Generiraj client
npx prisma generate

# 4. Testiraj
npm run db:studio
```

## Dodajanje Novih Modelov

1. Ustvari novo `.prisma` datoteko v ustrezni domeni
2. Dodaj import v `schema/_index.prisma`
3. Zaženi `npm run db:generate`
4. Kreiraj migracijo: `npm run db:migrate`

### Primer: Dodajanje novega modela

```prisma
// prisma/schema/02-tourism/amenity.prisma
model Amenity {
  id          String    @id @default(cuid())
  propertyId  String
  name        String
  category    String?
  createdAt   DateTime  @default(now())
  property    Property  @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@index([propertyId])
  @@map("amenities")
}
```

Nato dodaj import v `_index.prisma`:
```prisma
import "./02-tourism/amenity.prisma"
```
