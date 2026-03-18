# 📝 NAVODILA: Posodobi DATABASE_URL za Neon Direct Connection

## ⚠️ TRENUTNO STANJE

Tvoj trenutni `DATABASE_URL` v `.env.local`:
```
DATABASE_URL="postgres://b7a41b81c9e5e820c32f5dc3cd8a33ee353337302335d377c9612b3d9de5a830:sk_OkP4Zm_mT_ZXd69wcAn32@db.prisma.io:5432/postgres?sslmode=require"
```

**To je Prisma mock baza** - ne deluje za prave migracije!

---

## ✅ KORAK 1: Pridobi Neon Direct Connection URL

### 1.1 Odpri Neon Dashboard
```
https://console.neon.tech/
```

### 1.2 Prijavi se in izberi projekt
- Projekt: `ep-snowy-sun-aia7r9c2` (AgentFlow Pro)

### 1.3 Pojdi na Connection Details
- Klikni na projekt
- **Settings** → **Connection Details**
- ALI klikni **Connect** → **PostgreSQL**

### 1.4 Kopiraj DIRECT Connection URL
**POMEMBNO:** Ne kopiraj "Pooled connection"!

Išči:
```
Direct connection
postgresql://user:password@ep-snowy-sun-aia7r9c2.us-east-1.aws.neon.tech/neondb?sslmode=require
           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
           BREZ "-pooler" dela!
```

**Primer pravilnega URL-ja:**
```bash
postgresql://agentflow_pro_owner:XyZ123AbC@ep-snowy-sun-aia7r9c2.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**NAPAKA (pooled - ne deluje za migracije):**
```bash
postgresql://agentflow_pro_owner:XyZ123AbC@ep-snowy-sun-aia7r9c2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require
                                                                 ^^^^^^^^
```

---

## ✅ KORAK 2: Posodobi .env.local

### 2.1 Odpri `.env.local`
```bash
# V projektu AgentFlow Pro
f:\ffff\agentflow-pro\.env.local
```

### 2.2 Zamenjaj DATABASE_URL vrstico

**ZAMENJAJ:**
```bash
DATABASE_URL="postgres://b7a41b81c9e5e820c32f5dc3cd8a33ee353337302335d377c9612b3d9de5a830:sk_OkP4Zm_mT_ZXd69wcAn32@db.prisma.io:5432/postgres?sslmode=require"
```

**Z:**
```bash
DATABASE_URL="postgresql://tvoj-user:tvoj-password@ep-snowy-sun-aia7r9c2.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

### 2.3 Shrani datoteko

---

## ✅ KORAK 3: Omogoči pgvector Extension

### 3.1 V Neon Dashboardu
- **Settings** → **Extensions**
- Najdi `vector` v seznamu
- Klikni **Enable**

### 3.2 ALI uporabi SQL Editor
- **SQL Editor**
- Zaženi:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## ✅ KORAK 4: Zaženi Migracijo

```bash
cd f:\ffff\agentflow-pro
npx prisma migrate dev --name add_housekeeping_and_billing
```

---

## ✅ KORAK 5: Preveri Uspeh

```bash
# Če je uspešno:
✓ Generated Prisma Client
✓ Your database is now in sync with your schema

# Če napaka:
# - Preveri če je pgvector omogočen
# - Preveri če je DATABASE_URL pravilen (brez -pooler)
```

---

## 🔄 KORAK 6 (Optional): Vrni Pooled Connection za Runtime

Po uspešni migraciji lahko vrneš pooled URL za boljšo performance:

```bash
# V .env.local zamenjaj z pooled URL:
DATABASE_URL="postgresql://user:password@ep-snowy-sun-aia7r9c2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**Zakaj?**
- **Direct connection**: Boljši za migracije (dlje življenjska doba connection)
- **Pooled connection**: Boljši za runtime (connection pooling, hitrejši)

---

## 📊 POVZETEK

| Korak | Kaj | Zakaj |
|-------|-----|-------|
| 1 | Kopiraj Direct URL iz Neona | Potrebuješ pravo bazo |
| 2 | Zamenjaj v .env.local | Da Prisma ve kam se spojiti |
| 3 | Omogoči pgvector | Za semantic memory feature |
| 4 | Zaženi migracijo | Kreiraj tabele |
| 5 | (Optional) Vrni pooled URL | Boljša performance |

---

## ⚠️ POGOSTE NAPAKE

### ❌ "vector_cosine_ops does not exist"
**Rešitev:** Omogoči pgvector extension v Neon dashboardu

### ❌ "Connection refused"
**Rešitev:** Preveri če je URL pravilen (brez -pooler za migracije)

### ❌ "Authentication failed"
**Rešitev:** Preveri username/password v URL-ju

### ❌ "Database URL is using pooled connection"
**Rešitev:** Odstrani `-pooler` iz URL-ja

---

## 🆘 POTREBUJEM POMOČ

Če potrebuješ pomoč:
1. Screenshotaj Neon Connection Details
2. Pošlji (skrij geslo!)
3. Pomagam ti preveriti format

---

**Ko boš končal, zaženi:**
```bash
npx prisma migrate dev --name add_housekeeping_and_billing
```
