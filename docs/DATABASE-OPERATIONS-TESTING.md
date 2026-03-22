# Database Operations Testing

Sistematično testiranje database modelov in operacij s Prisma Studio, seed in ročnimi preverjanji.

## Predpogoj

1. **Database** – `DATABASE_URL` v `.env`, baza dostopna
2. **Reset (opcijsko):** `npx prisma db push --force-reset` – izbriše vse podatke
3. **Seed:** `npm run db:seed` ali `npx prisma db seed` – ustvari e2e user in sample podatke

---

## Ukazi

| Ukaz | Namen |
|------|-------|
| `npx prisma studio` | Vizualni pregled in ročni insert/update |
| `npx prisma db push --force-reset` | Reset baze (izbriše vse) |
| `npm run db:seed` | Zažene seed (e2e user + sample data) |

---

## Test checklist

### 1. UserTemplate

| Korak | Kaj | Kako |
|-------|-----|------|
| 1.1 | Shrani template | `npm run dev` → `/dashboard/tourism/generate` → izberi prompt, izpolni, Generate → Save as Template |
| 1.2 | Naloži seznam | `/dashboard/tourism/templates` – preveri prikaz shranjenih template-ov |
| 1.3 | Naloži po ID | `/dashboard/tourism/generate?template={id}` – preveri, da se naloži prompt in customVars |
| 1.4 | Preveri v DB | Prisma Studio → `user_templates` – preveri zapise za e2e-user-1 |
| 1.5 | Uredi | PATCH ` /api/user/templates/{id}` z body `{ name, customVars }` (ali Postman) |

**Seed:** Po seed so na voljo 2 template-a (Apartmaji Bela Krajina, Družinski opis).

---

### 2. LandingPage

| Korak | Kaj | Kako |
|-------|-----|------|
| 2.1 | Generiraj | `/dashboard/tourism/landing` → Generate (ni Shrani gumba – trenutno ne shranjuje) |
| 2.2 | Preveri v DB | Prisma Studio → `landing_pages` – seed vstavi 1 zapis (slug: seed-landing-bela-krajina) |
| 2.3 | Ročni insert | V Prisma Studio dodaj nov LandingPage zapis za test |

**Opomba:** Generiranje ne shranjuje v DB. Za poln flow potrebna implementacija Shrani + GET API.

---

### 3. TranslationJob

| Korak | Kaj | Kako |
|-------|-----|------|
| 3.1 | Ustvari job | `/dashboard/tourism/translate` → vnesi besedilo, izberi jezike, Prevedi |
| 3.2 | Preveri status | Prisma Studio → `translation_jobs` – `status: "completed"`, `results` JSON |
| 3.3 | Node REPL | Glej primer spodaj |

**Node REPL primer:**
```js
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
const jobs = await p.translationJob.findMany({
  orderBy: { createdAt: "desc" },
  take: 5
});
console.log(jobs.map(j => ({
  id: j.id,
  status: j.status,
  hasResults: !!j.results
})));
await p.$disconnect();
```

**Seed:** 1 TranslationJob (completed) z mock prevodi.

---

### 4. BlogPost

| Korak | Kaj | Kako |
|-------|-----|------|
| 4.1 | Generiraj | `/dashboard/tourism/generate` (tourism) ali splošni content flow |
| 4.2 | Shrani | Tourism generate ne shranjuje v BlogPost. Splošni `/api/generate-content` shranjuje. |
| 4.3 | History | GET `/api/content/history` (avtenticiran) – seznam blog postov |
| 4.4 | Export | GET `/api/content/export?format=markdown` ali `?format=json` – prenos |

**Seed:** 2 BlogPost zapisa za e2e-user-1.

---

### 5. SeoMetric

| Korak | Kaj | Kako |
|-------|-----|------|
| 5.1 | Dodaj mock | Prisma Studio → `seo_metrics` – ročni insert (userId, contentType, keyword, position, searchVolume) |
| 5.2 | Preveri prikaz | SEO dashboard (`/dashboard/tourism/seo`) uporablja GSC API; SeoMetric se trenutno ne bere kot fallback |

**Seed:** 5 SeoMetric zapisov (mock keywords) za e2e-user-1.

---

## Seed vsebina (po `npm run db:seed`)

| Model | Št. | Opis |
|-------|-----|------|
| User | 2 | e2e-user-1 (e2e@test.com), anonymous |
| UserTemplate | 2 | Apartmaji Bela Krajina, Družinski opis |
| LandingPage | 1 | Apartmaji Bela Krajina – Seed |
| TranslationJob | 1 | Completed z SL→EN, DE prevodi |
| BlogPost | 2 | 5 nasvetov Bela Krajina, Kolpa |
| SeoMetric | 5 | apartmaji bela krajina, počitnice kolpa, … |

---

## Hitri Prisma poizvedba iz terminala

```bash
node -e "const {PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.user.findMany().then(u=>console.log(u.length+' users')).finally(()=>p.\$disconnect())"
```
