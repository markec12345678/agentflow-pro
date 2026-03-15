# GitHub ↔ Vercel ujemanje – pregled

**Datum:** 27. 2. 2026 | **Zadnji update:** 27. 2. 2026

---

## ✅ Popravljeno (27. 2.)

| Problem | Status |
|---------|--------|
| **Neujemanje vej** | main → master merged in pushed ✓ |
| **buildCommand** | Dodan v vercel.json, commit ce26710 na master ✓ |
| **Prisma migracije** | Ob naslednjem deployu bo `prisma migrate deploy` ✓ |

---

## Trenutno stanje

| Element | Status |
|---------|--------|
| **Vercel projekt** | agentflow-pro (prj_aqbMqYRL7eQIr4DpYzNbZdN3UjXp) |
| **GitHub master** | ce26710 (buildCommand + eTurizem + tourism) |
| **Production deployment** | Stari build (12a9e65); nov build še ni bil sprožen |
| **Domena** | agentflow-pro-seven.vercel.app ✅ |
| **/api/health** | `{"ok":true}` ✅ |

---

## Kaj moraš narediti ročno

### 1. Sproži redeploy (da bo nov build z migracijami)

**Možnost A – Git (če je povezan):**
- Vercel bi moral sam deployirati ob pushu. Če ni, preveri: [Settings → Git](https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro/settings/git) – Connected to `markec12345678/agentflow-pro`, branch **master**.

**Možnost B – Redeploy iz Dashboard:**
1. [Deployments](https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro) → zadnji deployment → **⋯** → **Redeploy**
2. Ali: **Deployments** → **Redeploy** (izbere zadnji commit)

**Možnost C – Vercel CLI:**
```bash
npx vercel --prod
```

### 2. Env spremenljivke (Production)

| Spremenljivka | Kritično | Status |
|---------------|----------|--------|
| DATABASE_URL | Da | ✓ (iz screenota) |
| NEXTAUTH_URL | Da | ✓ |
| NEXTAUTH_SECRET | Da | ✓ |
| STRIPE_* | Za billing | Opcijsko; verify script jih manjka lokalno |

Preveri: [Settings → Environment Variables](https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro/settings/environment-variables). Za migracije mora biti **DATABASE_URL** nastavljen (pooled connection string).

### 3. Po redeployu

- Preveri: https://agentflow-pro-seven.vercel.app/api/health
- Build logi: Deployments → zadnji → Build Logs → preveri, da teče `prisma migrate deploy` pred `next build`
