# AgentFlow Pro - Admin Guide

Admin dashboard access and features.

## Access

1. Add your email to `ADMIN_EMAILS` in `.env` (comma-separated).
2. Example: `ADMIN_EMAILS="admin@example.com,owner@company.com"`
3. Log in and go to `/admin`.

## Tabs

### Users

List of users with email, name, plan, join date.

### Contact

Contact form submissions with name, email, company, plan, message.

### Usage Overview

Aggregated usage for the last 30 days:

- Total agent runs
- Total credits consumed
- Breakdown by agent type (research, content, code, deploy, chat, etc.)

Data from `/api/admin/usage`.

### Feature Flags

(Planned) Toggle features by plan (e.g. LangGraph for Enterprise). Not yet implemented.

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/users` | GET | List users |
| `/api/admin/contact-submissions` | GET | List contact submissions |
| `/api/admin/usage` | GET | Aggregated usage stats |

## Governance

- Only emails in `ADMIN_EMAILS` can access `/admin` and admin API routes.
- Admin routes check `isAdminEmail(session.user.email)`.
- No role-based admin tiers yet – all admins have full access.
