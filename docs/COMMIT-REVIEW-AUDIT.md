# AgentFlow Pro – Pregled commitov in audit

**Datum:** 2026-02-28  
**Preverjeno:** Zadnjih ~50 commitov, kritične API poti, shema, testi

---

## Popravljeno med auditirom

### 1. **`/api/tourism/workflow` – manjkajoča avtorizacija (kritično)**

**Težava:** POST endpoint je izvajal AI workflowe (Research, Content, Reservation, Communication agenti) **brez prijave**. Kdorkoli je lahko porabil AI kvote.

**Popravek:** Dodana je preverba `getServerSession()`; nepooblaščeni uporabniki dobijo 401.

---

## Ugotovitve (brez popravka)

### Varnost

| Komponenta | Stanje | Opomba |
|------------|--------|--------|
| `/api/tourism/faq` POST | Odprt namenoma | Javni chatbot na straneh lastnikov – porablja LLM, lahko logira; smiselno omejiti ali rate-limit |
| `/api/auth/test-login` | Varno | Samo v dev (`NODE_ENV !== production`) |
| `/api/webhooks/stripe` | Varno | Preverjanje `stripe-signature` |
| `/api/tourism/email-scheduler` | Zaščiteno | CRON_SECRET / Vercel cron |
| Stripe webhook | Varno | Preverjanje podpisa |

### Konfiguracija

- **Prisma config:** `package.json#prisma.seed` je označen kot deprecated (Prisma 7) – prehod na `prisma.config.ts`.
- **build:vercel:** uporablja `prisma db push --force-reset --accept-data-loss` – nevarno, če se pade po napačni poti; trenutno namenjeno svežim deployem.

### Koda

- **188 ESLint opozoril** (brez napak) – predvsem unused vars in `any`.
- **console.log/warn/error** – v mnogih API rutah; v produkciji uporabiti Sentry ali strukturen logging.

### API avtentifikacija

Večina API rut uporablja `getServerSession(authOptions)`. Manjkajoča avtorizacija je bila le pri `/api/tourism/workflow`, in je popravljena.

---

## Priporočila

1. **Kratek rok:** Dodati rate limiting za `/api/tourism/faq` POST (npr. 10 req/min na IP).
2. **Srednji rok:** Premakniti Prisma seed v `prisma.config.ts`.
3. **Dolgi rok:** Zmanjšati ESLint opozorila, predvsem `any` in unused vars.

---

## Testi

- `npm run precommit`: ✅ 44 suites, 301 tests passed
- Lint: ✅ 0 errors (188 warnings)
