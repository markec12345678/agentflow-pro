# Smoke Checklist - Test Checklist

## Zagon testov

```bash
npm run test:e2e:smoke
```

## Checklist pokritost

| # | Test | Status |
|---|------|--------|
| **1. Simple Mode** | | |
| | Vnesi topic | ✅ `/generate?mock=1` |
| | Klikni Generate | ✅ |
| | Preveri da se prikažejo post-i | ✅ |
| **2. Advanced Mode** | | |
| | Ustvari workflow (import) | ✅ |
| | Klikni Run | ✅ |
| | Preveri Execution Progress | ✅ |
| | Exportaj JSON | ✅ |
| | Importaj JSON | ✅ |
| **3. Database** | | |
| | Shrani workflow | ⏭️ Zahteva DATABASE_URL |
| | Odpri Dashboard | ✅ |
| | Preveri "Saved Workflows" | ⏭️ Zahteva DATABASE_URL |
| **4. Phase E – Auth** | | |
| | Forgot password (/forgot-password) | ✅ |
| | Reset password (/reset-password) | ✅ |
| | Verify email (/verify-email) | ✅ |
| **5. Vse strani** | | |
| | Homepage (/) | ✅ |
| | Dashboard (/dashboard) | ✅ |
| | Pricing (/pricing) | ✅ |
| | Contact (/contact) | ✅ |
| | Monitoring (/monitoring) | ✅ |

## Opombe

- **Simple Mode** uporablja `?mock=1` za hitre mock rezultate
- **Database test** se preskoči, če `DATABASE_URL` ni nastavljen
- Za polni Database test: `db:push` in nastavi `DATABASE_URL` v `.env`

## Ročno testiranje

1. **Simple Mode:** http://localhost:3002/generate (dodaj `?mock=1` za hitre rezultate)
2. **Advanced Mode:** http://localhost:3002/workflows
3. **Database:** Shrani workflow, odpri http://localhost:3002/dashboard
