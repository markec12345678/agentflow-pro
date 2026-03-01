# AgentFlow Pro – Pregled stanja projekta

**Datum:** 2026-03-01  
**Obseg:** Git, CI/CD, konfiguracije, GitHub

---

## 1. Git stanje

### Nepushane spremembe

| Kategorija | Število |
|------------|---------|
| Staged (pripravljen za commit) | 2 datoteki |
| Modified (unstaged) | 90+ datotek |
| Deleted | 2 (postcss.config.js, prisma/seed.js) |
| Untracked | 8+ datotek |

**Staged:**
- `docs/COMMIT-REVIEW-AUDIT.md` (nova)
- `src/app/api/tourism/workflow/route.ts` (modified)

**Pomembne spremembe, ki še niso v repozitoriju:**
- `.cursor/mcp.json`, `MCP_REQUIRED.md`, `ZAGON.md`
- `.github/dependabot.yml`, `e2e.yml`
- `package.json`, `package-lock.json`
- `prisma/schema.prisma`
- `postcss.config.mjs` (nova, nadomesti brisan `postcss.config.js`)
- `prisma/seed.ts` (nova, nadomesti brisan `prisma/seed.js`)
- `prisma.config.ts` (nova)
- Migracija `prisma/migrations/20260301044012_add_usage_alerts/`
- Veliko sprememb v `src/` in testih

### Veje

| Veja | Lokalno | Remote |
|------|---------|--------|
| main | ✓ aktivna | origin/main |
| master | obstaja | origin/master (default) |
| feature/tourism-layer | obstaja | PR #6 |

**Opomba:** GitHub default branch je `master`; CI teče na `main` in `master`.

---

## 2. Konflikti lokalno vs GitHub (main/master)

| Komponenta | Na GitHub (main) | Lokalno |
|------------|-----------------|---------|
| prisma seed | `node prisma/seed.js` | seed.js izbrisan, seed.ts + prisma.config.ts |
| postcss | postcss.config.js | izbrisan, postcss.config.mjs (@tailwindcss/postcss) |
| Prisma | 6.x | 7.x |
| Tailwind | 3.x | 4.x (@tailwindcss/postcss) |
| tsx | – | v devDependencies za seed |

**Posledica:** Če pushaš trenutne lokalne spremembe brez ustreznih commitov, bo:
- E2E workflow zrušen (db:seed uporablja seed.js, ki ne obstaja)
- Build lahko odpove (manjkajoča postcss konfiguracija za Tailwind 4)

---

## 3. Predlog ukrepov

### 3.1 Pred pushom

1. **Seed:** Uskladi seed z repozitorijem.
   - Če uporabljaš `prisma.config.ts`, dodaj v `package.json`:
     ```json
     "prisma": { "seed": "npx tsx prisma/seed.ts" }
     ```
   - V repozitorij dodaj `prisma/seed.ts` in `prisma.config.ts`, odstrani referenco na `seed.js`.

2. **PostCSS:** Dodaj `postcss.config.mjs` v repozitorij (Tailwind 4).

3. **Migracije:** Dodaj novo migracijo `20260301044012_add_usage_alerts` v repo.

4. **Preveri build:**
   ```bash
   npm run build
   npm run db:seed
   ```

### 3.2 Po pushu

1. Zaženi CI na `main`/`master`.
2. Preveri E2E workflow (seed in `properties.description` korak).
3. Oceni in po potrebi zapri Dependabot PR-je (#4–#6).

---

## 4. GitHub PR-ji

| PR | Naslov | Status |
|----|--------|--------|
| #6 | feat: FAZA 1-2 Export/Import + Execution Engine | Odprt (feature/tourism-layer → master) |
| #5 | chore(deps-dev): bump tailwindcss 3→4 | Odprt (Dependabot) |
| #4 | chore(deps-dev): bump @types/node 22→25 | Odprt (Dependabot) |
| #3, #2, #1 | Ostali Dependabot | Odprti |

---

## 5. Testi in Lint

| Preverjanje | Rezultat |
|-------------|----------|
| Lint | ✓ Pass |
| Unit tests | ✓ Pass |
| Build | Ne verificiran v tej seji |

---

## 6. MCP konfiguracija

- GitHub MCP deluje (token v projektu).
- **Varnost:** V `.cursor/mcp.json` je token hardcoded – priporočena uporaba `${GITHUB_TOKEN}` in .env.

---

## 7. Povzetek

**Status:** Lokalno je veliko sprememb, ki še niso v repozitoriju. Delna migracija (Prisma 7, Tailwind 4, nov seed) je v teku; brez ustreznih commitov in pusha bo CI/E2E verjetno odpovedal.

**Naslednji koraki:**
1. Commit vseh relevantnih sprememb (seed, postcss, migracije, package.json).
2. Uspešen lokalni build in seed.
3. Push na `main` in preverjanje CI.
4. Po potrebi združitev PR #6 in čiščenje Dependabot PR-jev.
