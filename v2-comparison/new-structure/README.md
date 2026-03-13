# V2 Architecture - 2026 Best Practices

## 🎯 Goal

Implement modern, scalable architecture using 2026 best practices while maintaining backwards compatibility with v1.

## 📁 Structure

```
src/
├── app/                    # Next.js App Router
├── components/             # UI components
├── features/               # Feature modules
├── entities/               # Domain entities
├── shared/                 # Cross-cutting concerns
├── services/               # Business logic
├── infrastructure/         # Infrastructure
└── lib/                    # Library wrappers
```

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Type check
npm run type-check

# Test
npm run test
```

## 📚 Documentation

- [Architecture Comparison](./ARCHITECTURE-COMPARISON.md)
- [Entity Patterns](./docs/entity-patterns.md)
- [Feature Modules](./docs/feature-modules.md)
- [Migration Guide](./docs/migration-guide.md)
