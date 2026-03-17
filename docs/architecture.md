# System Architecture

High-level overview of AgentFlow Pro architecture.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend:** Next.js API routes, Prisma ORM, PostgreSQL
- **AI:** OpenAI GPT-4, Multi-agent orchestration, Memory MCP
- **Auth:** NextAuth.js
- **Deploy:** Vercel, Docker

## Key Components

- **Orchestrator** – coordinates Research, Content, Code, Deploy agents
- **Knowledge Graph** – Memory MCP for persistent context
- **Workflow Builder** – visual agent orchestration
- **Tourism Hub** – property management, reservations, calendar

## Related

- [Project Structure](./PROJECT-STRUCTURE.md)
- [Database Schema](./database-setup.md)
- [README](../README.md) – full architecture section
