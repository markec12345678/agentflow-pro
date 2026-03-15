# Database Schema

Data model documentation for AgentFlow Pro.

## Overview

The application uses PostgreSQL with Prisma ORM. Schema is defined in `prisma/schema.prisma`.

## Key Models

- **User** – accounts, roles, teams
- **Property** – tourism properties, rooms
- **Reservation** – bookings, payments
- **BlogPost** – generated content
- **Workflow** – saved workflows
- **Subscription** – Stripe subscriptions

## Setup

See [database-setup.md](./database-setup.md) for connection string and migration steps.

## Migrations

```bash
npm run db:migrate        # Development
npm run db:migrate:deploy # Production
```
