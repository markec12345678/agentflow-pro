# 🤖 AgentFlow Pro

**Multi-Agent AI Platform for Business Automation - Specialized for Tourism & Hospitality**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-informational)](https://www.prisma.io/)

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🏗️ Architecture](#️-architecture)
- [🚀 Quick Start](#-quick-start)
- [📦 Installation](#-installation)
- [⚙️ Configuration](#️-configuration)
- [🤖 AI Agents](#-ai-agents)
- [🎨 Usage](#-usage)
- [🧪 Testing](#-testing)
- [📚 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

AgentFlow Pro is a sophisticated multi-agent AI platform designed specifically for tourism and hospitality businesses. It automates content creation, manages guest communications, handles reservations, and optimizes marketing campaigns - all while maintaining brand consistency and SEO best practices.

### Key Benefits

- **🎯 Tourism Specialized**: Built specifically for hotels, resorts, and travel agencies
- **🤖 Multi-Agent System**: 8 specialized AI agents working together
- **🌍 Multi-Language**: Generate content in multiple languages
- **📈 SEO Optimized**: Built-in SEO optimization and analytics
- **🔗 End-to-End**: From content creation to deployment
- **💰 Cost Effective**: Reduce content creation costs by 80%

## ✨ Features

### 🤖 AI Agents
- **Research Agent**: Market intelligence and competitor analysis
- **Content Agent**: SEO-optimized blog posts, landing pages, and social media
- **Code Agent**: Automated development and deployment
- **Deploy Agent**: One-click deployments to Vercel/Netlify
- **Communication Agent**: Personalized guest communications
- **Personalization Agent**: Brand voice consistency
- **Reservation Agent**: Automated booking management
- **Optimization Agent**: Performance and conversion optimization

### 🏗️ Core Platform
- **Visual Workflow Builder**: Drag-and-drop agent orchestration
- **Knowledge Graph**: Persistent memory and context management
- **Multi-Property Support**: Manage multiple properties/locations
- **Team Collaboration**: Role-based access and team workflows
- **Analytics Dashboard**: Comprehensive performance metrics

### 🏨 Tourism Features
- **Property Management**: Room inventory, rates, and availability
- **Guest Management**: Profiles, preferences, and communication history
- **Reservation System**: Automated booking and confirmation workflows
- **Multi-Language Content**: Generate content in 20+ languages
- **SEO Tools**: Keyword tracking and optimization recommendations

## 🏗️ Architecture

### Tech Stack

**Frontend**
- Next.js 15 + React 19 + TypeScript
- TailwindCSS + shadcn/ui components
- Zustand for state management
- React Flow for workflow visualization

**Backend**
- Node.js + Express + TypeScript
- PostgreSQL + Prisma ORM
- Redis for caching and queues
- NextAuth.js for authentication

**AI Infrastructure**
- OpenAI GPT-4 for content generation
- Memory MCP for knowledge graph
- Sequential Thinking MCP for decision making
- Custom agent orchestration system

**Deployment & Monitoring**
- Vercel for frontend hosting
- Docker for agent containers
- Sentry for error tracking
- GitHub Actions for CI/CD

### MCP Integrations
- **Memory**: Knowledge graph and context persistence
- **GitHub**: Code management and version control
- **Vercel/Netlify**: Deployment automation
- **Firecrawl**: Web scraping and research
- **Context7**: API documentation integration
- **Playwright**: E2E testing automation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+
- Redis 6+
- OpenAI API key

### One-Click Setup
```bash
# Clone the repository
git clone https://github.com/your-org/agentflow-pro.git
cd agentflow-pro

# Install dependencies
npm install

# Setup environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Setup database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3002` to get started.

## 📦 Installation

### Environment Variables
Create `.env.local` with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/agentflow_pro"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3002"

# AI Services
OPENAI_API_KEY="sk-..."
OPENAI_BASE_URL="https://api.openai.com/v1"

# External APIs
GITHUB_TOKEN="ghp_..."
FIRECRAWL_API_KEY="fc-..."
CONTEXT7_API_KEY="..."

# Optional
REDIS_URL="redis://localhost:6379"
SENTRY_DSN="https://..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
# Email (verification, password reset, team invites)
RESEND_API_KEY="re_..."
EMAIL_FROM="AgentFlow Pro <notifications@agentflow.pro>"
```

### MCP Setup

AgentFlow Pro uses Model Context Protocol (MCP) servers for AI-assisted development. Configure them in `~/.cursor/mcp.json`:

| MCP | Purpose | Env Variable |
|-----|---------|--------------|
| Memory | Knowledge graph & context | — |
| GitHub | Repo management | `GITHUB_TOKEN` |
| Git | Version control | — |
| Playwright | E2E testing | — |
| Firecrawl | Web scraping | `FIRECRAWL_API_KEY` |
| Context7 | API documentation | `CONTEXT7_API_KEY` |
| Vercel | Frontend deploy | — |
| Docker | Agent containers | — |
| Sentry | Error monitoring | — |
| Sequential Thinking | Complex decisions | — |

See [.cursor/MCP_REQUIRED.md](.cursor/MCP_REQUIRED.md) for full mcp.json reference and verification.

### Production (Vercel)

For production deployment, see [docs/VERCEL-ENV-CHECKLIST.md](docs/VERCEL-ENV-CHECKLIST.md) for required variables: `DATABASE_URL`, `STRIPE_*`, `NEXTAUTH_*`, `SENTRY_*`, and optional `RESEND_API_KEY`, `EMAIL_FROM` (Phase E – email verification, password reset, team invites).

### Database Setup
```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

## ⚙️ Configuration

### Agent Configuration
Each agent can be configured in `src/agents/[agent]/config.ts`:

```typescript
export const agentConfig = {
  maxRetries: 3,
  timeout: 30000,
  model: "gpt-4-turbo",
  temperature: 0.7,
};
```

### Workflow Builder
Create custom workflows in the visual builder or via API:

```typescript
const workflow = {
  name: "Blog Post Generator",
  nodes: [
    { id: "1", type: "research", data: { query: "tourism trends 2024" } },
    { id: "2", type: "content", data: { format: "blog-post" } },
    { id: "3", type: "deploy", data: { platform: "vercel" } }
  ],
  edges: [
    { source: "1", target: "2" },
    { source: "2", target: "3" }
  ]
};
```

## 🤖 AI Agents

### Research Agent
Gathers market intelligence and competitor data.
```typescript
const research = await orchestrator.queueTask("research", {
  query: "luxury resort trends 2024",
  sources: ["firecrawl", "serpapi"],
  outputFormat: "structured-json"
});
```

### Content Agent
Generates SEO-optimized content.
```typescript
const content = await orchestrator.queueTask("content", {
  type: "blog-post",
  topic: "Sustainable Tourism Practices",
  seoKeywords: ["sustainable travel", "eco-friendly resorts"],
  language: "en"
});
```

### Code Agent
Automates development tasks.
```typescript
const code = await orchestrator.queueTask("code", {
  task: "Add booking form validation",
  repo: "your-org/your-repo",
  createPr: true
});
```

### Deploy Agent
Handles deployments automatically.
```typescript
const deploy = await orchestrator.queueTask("deploy", {
  platform: "vercel",
  project: "my-tourism-site",
  environment: "production"
});
```

## 🎨 Usage

### Creating Your First Workflow

1. **Navigate to Workflows**: Click "Workflows" in the dashboard
2. **Create New Workflow**: Click "New Workflow"
3. **Add Agents**: Drag agents from the sidebar to the canvas
4. **Configure Agents**: Click each agent to set parameters
5. **Connect Agents**: Drag connections between agents
6. **Test Workflow**: Click "Test" to validate
7. **Deploy**: Click "Deploy" to activate

### Managing Properties

1. **Go to Properties**: Access via dashboard
2. **Add Property**: Fill in property details
3. **Configure Settings**: Set rates, rooms, and policies
4. **Connect Agents**: Enable specific agents for this property

### Generating Content

1. **Select Content Type**: Blog post, landing page, or social media
2. **Input Topic**: Describe what you want to create
3. **Choose Language**: Select target language
4. **Generate**: Click "Generate" and wait for AI to complete
5. **Review & Edit**: Make any necessary adjustments
6. **Publish**: Deploy to your website or social channels

## 🧪 Testing

### Run All Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# API tests
npm run test:api

# Tourism-specific tests
npm run test:tourism
```

### Test Coverage
```bash
# Generate coverage report
npm run test -- --coverage
```

### E2E Testing with Playwright
```bash
# Install Playwright browsers
npm run playwright:install

# Run tests in UI mode
npm run test:e2e:ui

# Run specific test suite
npm run test:e2e:tourism
```

## 📚 Documentation

- **[API Documentation](./docs/api.md)**: REST API reference
- **[Phase E – Auth & Email](./docs/PHASE-E-AUTH-EMAIL.md)**: Email flow, password reset, User Profile API
- **[Agent Development](./docs/agent-development.md)**: Building custom agents
- **[Deployment Guide](./docs/DEPLOYMENT.md)**: Production deployment
- **[Troubleshooting](./docs/troubleshooting.md)**: Common issues

### Architecture Diagrams
- **[System Architecture](./docs/architecture.md)**: High-level overview
- **[Database Schema](./docs/database.md)**: Data model documentation
- **[Agent Flow](./docs/agent-flows.md)**: Agent interaction patterns

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🆘 Support

- **Documentation**: [agentflow-pro.docs](https://agentflow-pro.docs)
- **Issues**: [GitHub Issues](https://github.com/your-org/agentflow-pro/issues)
- **Email**: support@agentflow.pro
- **Discord**: [Community Server](https://discord.gg/agentflow-pro)

## 🚀 Roadmap

### Version 1.1 (Q2 2024)
- [ ] Advanced analytics dashboard
- [ ] Custom agent builder
- [ ] Mobile app (React Native)
- [ ] Advanced workflow templates

### Version 2.0 (Q3 2024)
- [ ] Enterprise features
- [ ] White-label options
- [ ] Advanced integrations (Slack, Zapier)
- [ ] AI-powered pricing optimization

---

**Built with ❤️ for the tourism industry**

*AgentFlow Pro - Transform your hospitality business with AI automation*
