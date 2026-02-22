# AGENTS.md – Fullstack Project Template

AI-oriented project instructions per [AGENTS.md specification](https://agentsmd.io/). Compatible with Cursor, GitHub Copilot, Claude Code.

## Overview

Fullstack web application template with Next.js (frontend) and optional FastAPI (backend). Use this as the project root AGENTS.md.

## Setup & Commands

- **Install**: `pnpm install` or `npm install`
- **Dev server**: `pnpm dev` or `npm run dev`
- **Build**: `pnpm build` or `npm run build`
- **Lint**: `pnpm lint` or `npm run lint`

## Tech Stack

- **Frontend**: Next.js 14+, React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend** (optional): FastAPI, Pydantic, async databases
- **State**: React Query / TanStack Query, Zustand or Jotai

## Project Structure

```
/app          – Next.js App Router pages, layouts
/components   – Reusable UI components
/lib          – Utilities, API clients
/hooks        – Custom React hooks
/api          – API routes (Next.js) or backend
```

## Conventions

- Prefer Server Components; use 'use client' only when needed.
- Use Zod for form/API validation.
- Semantic color tokens: `bg-accent`, `text-text`, `border-border`.
- Path alias: `~/*` → `./src/*` (tsconfig).

## Navodila za MCP (AI agent)

Imaš dostop do **Filesystem MCP**. Če potrebuješ primere implementacije, prebrskaj **F:/d/bolt-diy** ali **F:/d/shadcn-builder**.
- Preden ustvariš novo kompleksno komponento, uporabi `list_directory` na `F:/d/shadcn-builder/src/components`.
- Upoštevaj strukturo, ki jo generira bolt-diy (F:/d/bolt-diy) za kompatibilnost.

## Agent Guidelines

- Reuse existing components; extend, don't duplicate.
- Follow patterns in `.cursor/rules/`.
- Check devlog.md before major changes.
- Run lint before committing.

---

*Adapted from: innei-template/nextjs-boilerplate, agentsmd.io, developertoolkit.ai*
