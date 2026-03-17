# Entity-First Architecture Patterns

## 📚 What are Entities?

Entities are **domain objects** that represent core business concepts. They are the single source of truth for types, validation, and business rules.

### Example: Property Entity

```
src/entities/property/
├── types.ts      # TypeScript types
├── schemas.ts    # Zod validation
└── index.ts      # Public exports
```

---

## 🎯 Why Entity-First?

### Traditional Approach (❌)

```typescript
// Types scattered everywhere
interface Property { /* ... */ }  // In component

// Validation duplicated
if (!name || name.length < 3) { /* ... */ }  // In API

// No reusability
```

### Entity-First Approach (✅)

```typescript
// Single source of truth
import { Property, propertyCreateSchema } from '@/entities/property';

// Used everywhere
function API() {
  const validated = propertyCreateSchema.parse(body);
}

function Component() {
  const { data } = useQuery<Property>(...);
}
```

---

## 🏗️ Entity Structure

### 1. Types (`types.ts`)

**Purpose:** Define TypeScript types for the domain

```typescript
// Core entity
export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  pricePerNight: number;
  // ...
}

// Variants for different use cases
export interface PropertySummary { /* lighter */ }
export interface PropertyWithAvailability extends Property { /* ... */ }

// Input types
export interface PropertyCreateInput { /* ... */ }
export type PropertyUpdateInput = Partial<PropertyCreateInput>;

// Filter types
export interface PropertyFilters { /* ... */ }
```

**Best Practices:**
- ✅ One interface per concept
- ✅ JSDoc comments for clarity
- ✅ Use unions for enums (better than `enum`)
- ✅ Include all variants (summary, full, with relations)

---

### 2. Schemas (`schemas.ts`)

**Purpose:** Runtime validation with Zod

```typescript
import { z } from 'zod';

// Base schema
export const propertyCreateSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['apartment', 'house', 'room']),
  pricePerNight: z.number().positive(),
  // ...
});

// Derived schemas
export const propertyUpdateSchema = propertyCreateSchema.partial();

export const propertyFiltersSchema = z.object({
  type: z.array(z.enum(['apartment', 'house', 'room'])).optional(),
  minPrice: z.number().positive().optional(),
  // ...
});

// Response schemas
export const propertyResponseSchema = propertyCreateSchema.extend({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});
```

**Best Practices:**
- ✅ Match types exactly (types ↔ schemas)
- ✅ Use descriptive error messages
- ✅ Create derived schemas (partial, omit, extend)
- ✅ Validate API responses, not just requests

---

### 3. Index (`index.ts`)

**Purpose:** Clean public API

```typescript
export * from './types';
export * from './schemas';
```

---

## 🔄 Usage Patterns

### In API Routes

```typescript
// src/app/api/v1/properties/route.ts
import { propertyCreateSchema, propertyListQuerySchema } from '@/entities/property';

export async function POST(request: Request) {
  const body = await request.json();
  
  // ✅ Validate with schema
  const validated = propertyCreateSchema.parse(body);
  
  const property = await db.property.create({ data: validated });
  
  return Response.json(property);
}
```

### In Hooks

```typescript
// src/features/properties/hooks/useProperties.ts
import type { Property, PropertyFilters } from '@/entities/property';

export function useProperties(filters?: PropertyFilters) {
  return useQuery<Property[]>({
    queryKey: ['properties', filters],
    queryFn: () => propertyApi.getAll(filters)
  });
}
```

### In Components

```typescript
// src/features/properties/components/PropertyCard.tsx
import type { Property, PropertySummary } from '@/entities/property';

interface PropertyCardProps {
  property: Property | PropertySummary;
}

export function PropertyCard({ property }: PropertyCardProps) {
  return (
    <div>
      <h3>{property.name}</h3>
      <p>€{property.pricePerNight}</p>
    </div>
  );
}
```

### In Server Actions

```typescript
// src/features/properties/actions.ts
import { propertyCreateSchema } from '@/entities/property';

export async function createProperty(formData: FormData) {
  const rawData = Object.fromEntries(formData);
  
  // ✅ Validate server-side
  const validated = propertyCreateSchema.parse(rawData);
  
  const property = await db.property.create({ data: validated });
  
  return { success: true, data: property };
}
```

---

## 🎯 Benefits

### 1. Type Safety

```typescript
// ❌ Before: any types
function Component({ property }: { property: any }) { /* ... */ }

// ✅ After: Full type safety
function Component({ property }: { property: Property }) { /* ... */ }
```

### 2. Validation

```typescript
// ❌ Before: Manual checks
if (!name || name.length < 3) { /* ... */ }

// ✅ After: Declarative
const validated = propertyCreateSchema.parse(data);
```

### 3. Reusability

```typescript
// ✅ Same schema used everywhere
import { propertyCreateSchema } from '@/entities/property';

// In API
const apiData = propertyCreateSchema.parse(body);

// In form
const formData = propertyCreateSchema.parse(values);

// In test
const mockData = propertyCreateSchema.parse({ /* ... */ });
```

### 4. Documentation

```typescript
// ✅ Self-documenting
import { Property } from '@/entities/property';

function Component({ property }: { property: Property }) {
  // Everyone knows exactly what this is
}
```

---

## 📊 Entity vs Feature

| Aspect | Entity | Feature |
|--------|--------|---------|
| **Purpose** | Domain definition | Business logic |
| **Contains** | Types, schemas | Hooks, actions, components |
| **Dependencies** | None | Depends on entities |
| **Reusability** | High (used everywhere) | Medium (feature-specific) |
| **Example** | `Property` type | `useProperties` hook |

---

## 🚀 Creating New Entities

### Step 1: Define Types

```bash
mkdir -p src/entities/{entity}
```

```typescript
// src/entities/{entity}/types.ts
export interface {Entity} {
  id: string;
  // ...
}
```

### Step 2: Create Schemas

```typescript
// src/entities/{entity}/schemas.ts
export const {entity}CreateSchema = z.object({
  // ...
});
```

### Step 3: Export

```typescript
// src/entities/{entity}/index.ts
export * from './types';
export * from './schemas';
```

### Step 4: Use

```typescript
import { {Entity} } from '@/entities/{entity}';
```

---

## 📚 Resources

- [Zod Documentation](https://zod.dev)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Created:** 2026-03-13  
**Status:** Reference documentation
