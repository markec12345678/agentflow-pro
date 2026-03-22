# PMS Integration (Roadmap § 2.B.7)

Abstraction layer in `src/lib/tourism/pms-adapter.ts` for Property Management System integrations.

## Supported Providers

| Provider | Adapter | Status |
|----------|---------|--------|
| Mews | `MewsAdapter` | Implemented |

## Mews Setup

1. Obtain **Access Token** and **Client Token** from Mews Developer Dashboard.
2. Call sync API with credentials:

```bash
POST /api/tourism/pms-sync
Content-Type: application/json

{
  "propertyId": "<your-property-id>",
  "provider": "mews",
  "accessToken": "<mews-access-token>",
  "clientToken": "<mews-client-token>"
}
```

3. Sync fetches reservations from Mews (30 days back, 90 days forward) and creates/updates `Reservation` and `Guest` in AgentFlow DB.
4. **Produkcija:** Tokeni se shranijo v `PmsConnection` (propertyId + provider). POST `/api/tourism/pms-connections` – shrani; PMS sync bere iz DB, če niso v body. UI: dashboard → PMS Povezava.

## Adding New PMS (e.g. Opera)

1. Implement `PmsAdapter` in `src/lib/tourism/<name>-adapter.ts`.
2. Register in `getPmsAdapter()` in `mews-adapter.ts` (or move factory to `pms-adapter.ts`).
3. Add credentials handling in sync route.

## Periodic Sync

For cron/webhook: call `POST /api/tourism/pms-sync` with stored credentials. Consider Vercel Cron or external scheduler.
