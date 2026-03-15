# Preveritev deploymenta – hitri pregled

**27. 2. 2026**

---

## ✅ Kar je narejeno (Agent)

1. **vercel.json** – dodan `buildCommand: npm run build:vercel` (Prisma migracije ob deployu)
2. **main → master** – merge in push na GitHub
3. **GitHub** – master vsebuje commit ce26710 (buildCommand + eTurizem + tourism)

---

## 🔲 Kar moraš narediti ti

### 1. Redeploy na Vercelu

Vercel še vedno kaže stare deploymente (commit 12a9e65). Za nov build z migracijami:

1. Odpri [Vercel Deployments](https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro)
2. Klikni **Redeploy** pri zadnjem deploymentu ALI
3. Preveri [Settings → Git](https://vercel.com/robertpezdirc-4080s-projects/agentflow-pro/settings/git) – če je repo povezan, bo nov push na master sprožil deploy (push je bil že narejen, morda je treba ročno Redeploy)

### 2. Env spremenljivke (Vercel)

Iz tvojega screenshota imaš: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET` – to zadostuje za osnovno delovanje.

**Za Stripe (plačila):** če jih še nimaš, app deluje za login/dashboard, ne pa za subscribe. Dodaj po potrebi.

### 3. Po redeployu

- Preveri: https://agentflow-pro-seven.vercel.app/api/health → `{"ok":true}`
- Build logi: preveri, da teče `prisma migrate deploy` pred `next build`

---

## Lokalni verify script

`npm run verify:production-env` zahteva tudi Stripe keys. Za deployment brez billinga zadostujejo:
- DATABASE_URL
- NEXTAUTH_URL
- NEXTAUTH_SECRET
