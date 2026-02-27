# AgentFlow Pro - Launch Checklist (Verificirana)

## Pomembno opozorilo

**Database:** Trenutna [prisma/schema.prisma](../prisma/schema.prisma) uporablja samo **PostgreSQL** (`provider = "postgresql"`). SQLite (`file:./dev.db`) **ne deluje** – bi zahtevalo spremembo sheme.

---

## 1. Environment Variables (.env.local)

| Spremenljivka                                     | Obvezna            | Primer                                       |
| ------------------------------------------------- | ------------------ | -------------------------------------------- |
| DATABASE_URL                                      | Da                 | `postgresql://...` (Supabase ali lokalni PG) |
| MOCK_MODE                                         | Priporočeno za dev | `true` (brez API keys)                       |
| NEXTAUTH_URL                                      | Da                 | `http://localhost:3002`                      |
| NEXTAUTH_SECRET                                   | Da                 | poljuben secret za JWT                       |
| STRIPE_*                                          | Ne (za prod)       | `sk_test_...` za testiranje plačil           |
| OPENAI_API_KEY / ALIBABA_QWEN_API_KEY              | Ne                 | Samo če MOCK_MODE=false (LLM fallback)        |
| PUSHER_* / NEXT_PUBLIC_PUSHER_*                    | Ne                 | Real-time Canvas collaboration               |
| GITHUB_TOKEN, FIRECRAWL_API_KEY, CONTEXT7_API_KEY  | Ne                 | Samo če MOCK_MODE=false                      |

Glej [.env.example](../.env.example) in [database-setup.md](./database-setup.md) za Supabase.

---

## 2. Pred zagonom

```bash
cd projects/fullstack/agentflow-pro
npm install
npx prisma generate
npx prisma db push      # ali: npx prisma migrate deploy
npx prisma db seed
```

---

## 3. Zaženi Development Server

```bash
npm run dev
```

Pričakovani izhod v konzoli:

- Ready in Xs
- Compiled successfully
- Local: http://localhost:3002

Aplikacija: `http://localhost:3002`

**Drug port:** Če želiš port 3010, zaženi `npx next dev -p 3010` ali nastavi `"dev": "next dev -p 3010"` v package.json. Posodobi tudi NEXTAUTH_URL v .env.local.

---

## 4. Pred production deployem

- [ ] DATABASE_URL na produkcijski Supabase/PostgreSQL
- [ ] MOCK_MODE=false (če želiš prave API klice)
- [ ] NEXTAUTH_SECRET z varnim random stringom
- [ ] STRIPE ključi (sk_live_, pk_live_) za prod
- [ ] `npm run test:e2e:checklist` – preveri E2E testi

---

## Feature status (potrjen)

| Feature                    | Status |
| -------------------------- | ------ |
| Export/Import JSON         | Done   |
| Workflow Executor          | Done   |
| /api/workflows/execute     | Done   |
| Execution Progress Modal   | Done   |
| Mock Mode (auto brez keys) | Done   |
| Node Labels                | Done   |
| Error Retry (3x backoff)   | Done   |
| Prisma + Workflow model    | Done   |
| Save/Load Workflows        | Done   |
| Anonymous + Auth users     | Done   |
