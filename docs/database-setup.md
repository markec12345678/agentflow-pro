# Database Setup - AgentFlow Pro

## Env Variables

V `.env.local` nastavi:

- `DATABASE_URL` – PostgreSQL connection string (Supabase ali lokalni)
- `NEXTAUTH_SECRET` – secret za NextAuth JWT (npr. `openssl rand -base64 32`)
- `NEXTAUTH_URL` – npr. `http://localhost:3000`
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` – za Google sign-in (optional)

## Prisma Setup (korak za korakom)

```bash
# 1. Install dependencies (vključuje Prisma)
npm install

# 2. Generate Prisma Client
npx prisma generate
# ali: npm run db:generate

# 3. Run Migrations (dev - ustvari migracije če je treba)
npx prisma migrate dev --name add_workflow_nodes_edges
# ali: npm run db:migrate

# Ali za production / first deploy:
# npx prisma db push
# npx prisma migrate deploy

# 4. Seed Database
npx prisma db seed
# ali: npm run db:seed

# 5. (Optional) Open Prisma Studio
npx prisma studio
```

---

## Supabase (preporučeno)

Projekt uporablja **Supabase** za PostgreSQL bazo.

### Nastavitev

1. Ustvari projekt na [supabase.com](https://supabase.com)
2. V Supabase Dashboard: **Project Settings** → **Database**
3. Skopiraj **Connection string** (URI format)
4. Dodaš v `.env.local`:

```
DATABASE_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Za direktno povezavo (migracije):

```
DIRECT_URL="postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].supabase.co:5432/postgres"
```

5. Zaženi migracije:
```bash
npx prisma migrate deploy
npx prisma db seed
```

### Pomembno

- `.env.local` je v `.gitignore` – ključi ostanejo lokalno
- Ne commitaj `.env.local` v git
- Enkrat nastaviš in ostane na tvojem računalniku

---

## Troubleshooting: "Database ni dosegljiv"

Če `DATABASE_URL` ne deluje čeprav si ga že vnesel:

1. **Preveri lokacijo** – `.env.local` mora biti v **root** mapi projekta (tam kjer je `package.json`).

2. **Zaženi diagnostiko:**
   ```bash
   npm run db:check
   ```

3. **Posebni znaki v geslu** – če geslo vsebuje `@`, `#`, `?`, `:`, `/`, `\`, ga moraš URL-encodati:
   - JavaScript: `encodeURIComponent('tvoje-geslo')`
   - Ali spremeni geslo v Supabase na brez posebnih znakov

4. **Pravilen format Supabase:**
   - Pooler (port 6543): `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true`
   - Projekt REF in REGION najdeš v Supabase Dashboard → Project Settings → Database

5. **Restart dev serverja** – po spremembi `.env.local` vedno ponovno zaženi `npm run dev`.

6. **IPv6 / Firewall** – nekateri omrežja blokirajo Supabase. Preveri na drugi mreži ali z VPN.
