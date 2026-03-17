# Prisma Schema Modularizacija

## Struktura

```
prisma/
├── schema.prisma          # Glavni file (concatenated iz modules)
├── schema.original.prisma # Backup originalnega
├── modules/
│   ├── user.prisma        # User, auth, teams, roles
│   ├── property.prisma    # Property, rooms, amenities
│   ├── reservation.prisma # Reservations, bookings
│   ├── guest.prisma       # Guests, communications
│   ├── payment.prisma     # Payments, invoices, subscriptions
│   └── agent.prisma       # Agents, workflows, runs
└── migrations/
```

## Ukazi

```bash
# Regenerate schema from modules
npm run prisma:modularize

# Generate Prisma Client
npm run db:generate

# Run migrations
npm run db:migrate
```

## Status

- ✅ user.prisma - 15 modelov
- ✅ property.prisma - 8 modelov
- ⏳ reservation.prisma - TODO
- ⏳ guest.prisma - TODO
- ⏳ payment.prisma - TODO
- ⏳ agent.prisma - TODO

## Opombe

Prisma trenutno ne podpira importov v schema datotekah. 
Vsi modeli so concatenirani v glavno schema.prisma datoteko.
Module lahko urejate ločeno, nato pa zaženite `npm run prisma:modularize`.
