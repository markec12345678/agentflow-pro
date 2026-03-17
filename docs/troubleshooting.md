# Troubleshooting

Common issues and solutions for AgentFlow Pro.

## Development

**MODULE_NOT_FOUND vendor-chunks/@opentelemetry or ENOENT routes-manifest.json:** The `.next` build cache is corrupted or incomplete. Fix:

```bash
npm run clean
npm run dev
```

Or manually: delete the `.next` folder, then run `npm run dev`.

**Port in use:** If `localhost:3002` is busy, change the dev port in `package.json`: `"dev": "next dev -p 3010"` and set `NEXTAUTH_URL` accordingly in `.env.local`.

**Database connection:** Ensure `DATABASE_URL` is set and PostgreSQL is running. See [database-setup.md](./database-setup.md).

**Prisma client outdated:** Run `npm run db:generate` after schema changes.

## Authentication

**NextAuth errors:** Verify `NEXTAUTH_SECRET` (min 32 chars) and `NEXTAUTH_URL` matches your dev URL (e.g. `http://localhost:3002`).

**OAuth redirect:** For Google OAuth, add `{NEXTAUTH_URL}/api/auth/callback/google` to Authorized redirect URIs in Google Cloud Console.

## Deployment

See [production-launch-checklist.md](./production-launch-checklist.md) and [VERCEL-ENV-CHECKLIST.md](./VERCEL-ENV-CHECKLIST.md) for production setup.

## Related

- [Debugging](./DEBUGGING.md)
- [Database Setup](./database-setup.md)
