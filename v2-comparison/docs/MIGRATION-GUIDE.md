# Migration Guide: v1 → v2

## 📋 Overview

This guide walks you through migrating from the current v1 architecture to the new v2 (2026) architecture.

**Approach:** Incremental migration (strangler pattern)  
**Timeline:** 6-8 weeks  
**Risk:** Low (backwards compatible)

---

## 🎯 Phase 1: Foundation (Week 1-2)

### 1.1 Setup New Structure

```bash
# Create new directories
mkdir -p src/{entities,features,shared,infrastructure}

# Install new dependencies
npm install @tanstack/react-query zod
```

### 1.2 Create Entity Definitions

Start with your core domain entities:

```bash
# Example: Property entity
src/entities/property/
├── types.ts      # Domain types
└── schemas.ts    # Zod validation
```

**Action:** Copy types from `src/types/` and Prisma schema

### 1.3 Setup Infrastructure Layer

```bash
src/infrastructure/
├── database/index.ts    # Prisma client
├── cache/index.ts       # Redis (optional)
└── external-apis/       # Third-party clients
```

**Action:** Move existing DB client to new location

---

## 🚀 Phase 2: Feature Migration (Week 3-6)

### Migration Order:

1. **Properties** (simplest, proof of concept)
2. **Auth** (critical, well-defined)
3. **Bookings** (business logic)
4. **Dashboard** (complex, last)

### For Each Feature:

#### Step 1: Create Feature Module

```bash
src/features/{feature}/
├── components/
├── hooks/
├── api/
├── actions.ts
└── types.ts
```

#### Step 2: Extract Business Logic

**Before (v1):**
```typescript
// In component
async function handleDelete() {
  await fetch('/api/delete', { ... });
  router.refresh();
}
```

**After (v2):**
```typescript
// In hook
export function useDeleteProperty() {
  return useMutation({
    mutationFn: (id) => propertyApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries(...)
  });
}
```

#### Step 3: Create API Client

```typescript
// src/features/{feature}/api/{feature}Api.ts
export const propertyApi = {
  getAll: () => apiClient.get('/api/v1/properties'),
  getById: (id) => apiClient.get(`/api/v1/properties/${id}`),
  // ...
};
```

#### Step 4: Migrate Components

**Before (v1):**
```typescript
// Mixed concerns
export default async function PropertiesPage() {
  const properties = await db.property.findMany();
  return <PropertyList properties={properties} />;
}
```

**After (v2):**
```typescript
// Clean UI
export default function PropertiesPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PropertyList />
    </Suspense>
  );
}

// In PropertyList component
function PropertyList() {
  const { properties, isLoading } = useProperties();
  // ...
}
```

#### Step 5: Update API Routes

Move to versioned API:

```bash
src/app/api/properties/route.ts  →  src/app/api/v1/properties/route.ts
```

Add validation:

```typescript
// NEW: Validate with Zod
const validated = propertyCreateSchema.parse(body);
```

---

## 🧹 Phase 3: Cleanup (Week 7-8)

### 7.1 Remove Old Code

```bash
# After verifying new code works
rm -rf src/app/\(dashboard\)/properties/old-*
rm -rf src/components/features/PropertyCard.tsx.old
```

### 7.2 Update Imports

Run codemod to update imports:

```bash
npx @codemod/update-imports src/
```

### 7.3 Type Check & Test

```bash
# Full type check
npm run type-check

# Run tests
npm run test

# Build
npm run build
```

### 7.4 Performance Audit

```bash
# Check bundle size
npm run build-analyze

# Lighthouse
npm run lighthouse
```

---

## 📊 Migration Checklist

### Foundation
- [ ] Create directory structure
- [ ] Install dependencies (React Query, Zod)
- [ ] Setup entity definitions
- [ ] Configure API client
- [ ] Setup infrastructure layer

### Properties Feature
- [ ] Create `entities/property/types.ts`
- [ ] Create `entities/property/schemas.ts`
- [ ] Create `features/properties/api/propertyApi.ts`
- [ ] Create `features/properties/hooks/useProperties.ts`
- [ ] Create `features/properties/actions.ts`
- [ ] Migrate `PropertyCard` component
- [ ] Migrate `PropertyList` component
- [ ] Migrate properties page
- [ ] Migrate API routes to v1
- [ ] Test all flows

### Auth Feature
- [ ] Create `entities/user/types.ts`
- [ ] Create `entities/user/schemas.ts`
- [ ] Create `features/auth/hooks/useAuth.ts`
- [ ] Migrate login/register pages
- [ ] Update auth middleware

### Bookings Feature
- [ ] Create `entities/reservation/types.ts`
- [ ] Create `entities/reservation/schemas.ts`
- [ ] Create `features/bookings/` module
- [ ] Migrate booking flows
- [ ] Test payment integration

### Dashboard Feature
- [ ] Migrate dashboard widgets
- [ ] Update analytics
- [ ] Migrate calendar
- [ ] Test all integrations

### Cleanup
- [ ] Remove old files
- [ ] Update all imports
- [ ] Run type check
- [ ] Run tests
- [ ] Performance audit
- [ ] Update documentation

---

## 🛠️ Tools & Scripts

### Migration Codemod

```bash
# Install codemod tool
npm install -g @codemod/cli

# Run migration
codemod migrate-v2 src/
```

### Import Updater

```typescript
// scripts/update-imports.ts
const importMap = {
  '@/types': '@/entities',
  '@/lib/db': '@/infrastructure/database',
  '@/components/features': '@/features'
};
```

### Type Checker

```bash
# Strict type check
npx tsc --noEmit --strict

# Find any type errors
npm run type-check
```

---

## 🚨 Rollback Plan

If something goes wrong:

1. **Keep old code**: Don't delete, just rename to `.old`
2. **Feature flags**: Use env var to toggle
3. **Quick revert**: `git revert` if needed

```bash
# Example: Feature flag
if (process.env.USE_V2_ARCH === 'true') {
  return <NewPropertiesPage />;
} else {
  return <OldPropertiesPage />;
}
```

---

## 📈 Success Metrics

### Code Quality
- [ ] TypeScript errors: 0
- [ ] ESLint errors: 0
- [ ] Test coverage: >80%

### Performance
- [ ] Bundle size: -10%
- [ ] Page load: <2s
- [ ] Lighthouse: >90

### Developer Experience
- [ ] Build time: <30s
- [ ] Type check: <10s
- [ ] Hot reload: <1s

### User Experience
- [ ] No regressions
- [ ] Faster interactions
- [ ] Better error messages

---

## 📚 Resources

### Documentation
- [React Query Docs](https://tanstack.com/query)
- [Zod Docs](https://zod.dev)
- [Next.js App Router](https://nextjs.org/docs/app)

### Examples
- See `v2-comparison/new-structure/` for examples
- Check `ARCHITECTURE-COMPARISON.md` for patterns

### Support
- Ask in Slack #migration channel
- Book pairing session with tech lead
- Check migration issues on GitHub

---

**Last Updated:** 2026-03-13  
**Status:** Ready for migration
