---
name: fullstack-web
description: Builds websites and fullstack applications with Next.js, React, TypeScript, FastAPI. Use when creating web apps, SPAs, REST APIs, or fullstack projects with frontend and backend.
---

# Fullstack Web Development

## Quick Start

When building a web app:
1. **Frontend**: Next.js 14+ App Router, React, TypeScript, Tailwind, shadcn/ui
2. **Backend**: FastAPI (Python) or Next.js API routes
3. **Database**: PostgreSQL, MongoDB, or Supabase

## Stack Selection

| Need | Recommendation |
|------|----------------|
| SPA / marketing site | Next.js + Tailwind |
| Fullstack app | Next.js + API routes or FastAPI |
| Real-time | Supabase, Socket.io |
| Auth | NextAuth, Clerk, Supabase Auth |

## Patterns

- **Server Components** by default; `use client` only for interactivity
- **Zod** for validation (forms, API)
- **Error boundaries** (error.tsx) for graceful failures
- **REST** or **tRPC** for API design

## Resources

- Rules: `.cursor/rules/` in this setup
- [Next.js Docs](https://nextjs.org/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
