# Phase E – Auth, Email, Profile API

Kratek pregled Phase E implementacije: email pošiljanje, password reset, User Profile API.

## Email Flow (Resend)

**Env:** `RESEND_API_KEY`, `EMAIL_FROM` (glej [.env.example](../.env.example))

| Flow | Lokacija | Opis |
|------|----------|------|
| Verifikacija e-pošte | Registracija → `/verify-email?token=...` | Link v emailu, POST `/api/auth/verify-email` |
| Reset gesla | `/forgot-password` → email → `/reset-password?token=...` | PUT `/api/auth/password`, PATCH za potrditev |
| Team povabilo | Team invite → email z linkom | `UserService.sendTeamInvitation`, link na `/settings/teams` ali custom |

Brez `RESEND_API_KEY`: flow-ovi delujejo, vendar uporabnik ne prejme emailov.

## Password Reset Flow

1. **Zahteva reset:** `/forgot-password` – vnos emaila → PUT `/api/auth/password`
2. **Potrditev:** Email vsebuje link `/reset-password?token=...` – vnos novega gesla → PATCH `/api/auth/password`

Token je JWT (brez DB), veljaven omejen čas.

## User Profile API (Public API)

**Endpoint:** `GET/PUT /api/user/profile`  
**Auth:** `Authorization: Bearer <token>` (JWT iz prijave)

| Metoda | Opis |
|--------|------|
| GET | Vrne profil (id, email, name, role, onboarding) |
| PUT | Posodobi dovoljena polja (npr. `name`) |

Za pridobitev Bearer tokena uporabi login endpoint; token se uporablja za Public API kliente.

## API Middleware – checkPermission

`checkPermission(request, resource, action, scope)` v `lib/api-middleware.ts`:

- **scope: 'own'** – caller preveri lastništvo vira
- **scope: 'team'** – caller preveri članstvo v ekipi
- **scope: 'global'** – zahteva admin/owner vlogo

Helper `assertOwnResource(authUserId, resourceUserId)` za preverjanje lastništva.
