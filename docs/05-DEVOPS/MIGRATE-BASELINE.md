# Prisma Migrate – Baseline obstoječe baze

Če dobite napako **P3005: The database schema is not empty**, Prisma ne more izvesti migracij, ker baza že vsebuje tabele.

## Možnosti

### 1. Nova baza (prazna)

```bash
npm run db:migrate:deploy
```

### 2. Obstojeca baza (baseline)

Označite migracije kot že uporabljene:

```bash
npx prisma migrate resolve --applied 0_init
npx prisma migrate resolve --applied 20260219220000_add_itinerary
npx prisma migrate resolve --applied 20260221000000_add_credits_and_integration
# ... za vsako migracijo, ki je že v bazi
```

Nato za **nove** migracije (še ne izvedene):

```bash
npm run db:migrate:deploy
```

### 3. Development reset (brisanje vseh podatkov)

```bash
npx prisma migrate reset
```

---

**Preverjanje stanja:** `npx prisma migrate status`
