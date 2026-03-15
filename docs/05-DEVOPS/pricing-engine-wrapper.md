# Pricing Engine Wrapper Pattern

## Pregled

Ta dokumentacija opisuje TypeScript wrapper pattern za Rust pricing engine z avtomatskim fallback-om.

## Arhitektura

```
┌─────────────────────────────────────────────────────┐
│           API Route / Application Code              │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────┐
│        pricing-engine-wrapper.ts (Unified API)      │
│  ┌───────────────────────────────────────────────┐  │
│  │  calculatePrice()                             │  │
│  │  calculatePriceBatch()                        │  │
│  │  getEngineInfo()                              │  │
│  └───────────────────────────────────────────────┘  │
│           │                        │                │
│           │ Try Rust               │ Fallback       │
│           ▼                        ▼                │
│  ┌─────────────────┐    ┌─────────────────────┐    │
│  │ Rust Engine     │    │ TypeScript Engine   │    │
│  │ (10-100x faster)│    │ (Always available)  │    │
│  └─────────────────┘    └─────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

## Ključne Kompatibilnosti

### 1. **Enoten API**
Vsi klici gredo skozi `pricing-engine-wrapper.ts`, ki samodejno upravlja Rust/TS izbiro.

```typescript
// ✅ PRAVILNO - uporabi wrapper
import { calculatePrice } from '@/lib/tourism/pricing-engine-wrapper';

const result = await calculatePrice(100, checkIn, checkOut);

// ❌ NAROBNO - direktni klici
import { calculatePrice } from '@/lib/tourism/pricing-engine';
import { calculatePrice as rustCalculate } from '@/lib/tourism/pricing-engine-rust';
```

### 2. **Avtomatski Fallback**

Wrapper samodejno:
1. Poskusi uporabiti Rust engine
2. Ob napaki ali nedostopnosti uporabi TypeScript
3. Logga warning ob fallback-u

```typescript
// Interni flow wrapper-ja
export async function calculatePrice(...) {
  const engine = getRustEngine();
  
  if (engine) {
    try {
      return await rustCalculatePrice(...); // Try Rust
    } catch (error) {
      console.warn('Rust failed, using TS fallback');
      // Fall through to TS
    }
  }
  
  return tsCalculatePrice(...); // TypeScript fallback
}
```

### 3. **Singleton Pattern**

Rust engine se inicializira samo enkrat:

```typescript
let rustEngine: RustPricingEngine | null = null;
let rustAvailable: boolean | null = null;

function getRustEngine(): RustPricingEngine | null {
  if (rustAvailable === false) return null; // Fast path
  
  if (!rustEngine) {
    rustEngine = new RustPricingEngine();
    rustAvailable = rustEngine.isAvailable();
  }
  
  return rustAvailable ? rustEngine : null;
}
```

## Uporaba

### Osnovni Primer

```typescript
import { calculatePrice } from '@/lib/tourism/pricing-engine-wrapper';

// Date objects
const result = await calculatePrice(
  100, // baseRatePerNight
  new Date('2026-03-15'),
  new Date('2026-03-20')
);

// Ali ISO stringi
const result = await calculatePrice(
  100,
  '2026-03-15',
  '2026-03-20',
  {
    seasonRates: {
      high: [{ from: '2026-03-01', to: '2026-03-31', rate: 150 }]
    }
  }
);

console.log(result);
// {
//   baseTotal: 750,
//   adjustments: [...],
//   finalPrice: 637.50,
//   nights: 5
// }
```

### Batch Processing

```typescript
import { calculatePriceBatch } from '@/lib/tourism/pricing-engine-wrapper';

const results = await calculatePriceBatch([
  { id: '1', baseRate: 100, checkIn: '2026-03-15', checkOut: '2026-03-20' },
  { id: '2', baseRate: 150, checkIn: '2026-04-01', checkOut: '2026-04-05' },
]);

// Rust available: Parallel batch processing
// Rust unavailable: Parallel Promise.all with TS
```

### Monitoring & Debugging

```typescript
import { getEngineInfo, isRustAvailable } from '@/lib/tourism/pricing-engine-wrapper';

const info = getEngineInfo();
console.log(`Using ${info.engine} engine: ${info.available}`);
// "Using rust engine: true" ali "Using typescript engine: false"

if (!isRustAvailable()) {
  console.warn('Rust binary not found - using TypeScript fallback');
}
```

## API Reference

### `calculatePrice()`

```typescript
async function calculatePrice(
  baseRatePerNight: number,
  checkIn: Date | string,
  checkOut: Date | string,
  options?: {
    competitorAvg?: number;
    seasonRates?: SeasonRatesJson;
  }
): Promise<CalculatePriceResult>
```

**Return:**
```typescript
{
  baseTotal: number;
  adjustments: Array<{
    rule: string;
    amount: number;
    percent?: number;
  }>;
  finalPrice: number;
  nights: number;
}
```

### `calculatePriceBatch()`

```typescript
async function calculatePriceBatch(
  requests: Array<{
    id: string;
    baseRate: number;
    checkIn: Date | string;
    checkOut: Date | string;
    options?: CalculatePriceOptions;
  }>
): Promise<Array<{
  id: string;
  result: CalculatePriceResult;
  engine: 'rust' | 'typescript';
  error?: string;
}>>
```

### `getEngineInfo()`

```typescript
function getEngineInfo(): {
  engine: 'rust' | 'typescript';
  available: boolean;
  version?: string;
}
```

### `isRustAvailable()`

```typescript
function isRustAvailable(): boolean
```

### `reinitializeRustEngine()`

```typescript
function reinitializeRustEngine(): void
```

## Testing

### Unit Test Primer

```typescript
import { describe, it, expect, vi } from 'vitest';
import { calculatePrice } from '@/lib/tourism/pricing-engine-wrapper';

vi.mock('@/lib/tourism/pricing-engine-rust', () => ({
  RustPricingEngine: class MockEngine {
    isAvailable() { return false; }
    async calculatePrice() { throw new Error('Not available'); }
  }
}));

describe('pricing-engine-wrapper', () => {
  it('should use TypeScript fallback when Rust unavailable', async () => {
    const result = await calculatePrice(100, '2026-03-15', '2026-03-20');
    expect(result.finalPrice).toBeGreaterThan(0);
  });
});
```

## Performance

| Scenario | Rust Engine | TypeScript Fallback |
|----------|-------------|---------------------|
| Single calculation | ~1ms | ~10ms |
| Batch (100 items) | ~10ms | ~500ms |
| First call (init) | ~5ms | ~10ms |

**Opomba:** Rust engine je 10-100x hitrejši za kompleksne izračune.

## Troubleshooting

### Rust Binary Not Found

```
[PricingEngine] Rust binary not found, will use TypeScript fallback
```

**Rešitev:**
1. Preveri da je binary zgrajen: `cd rust/pricing-engine && cargo build --release`
2. Preveri pot: `target/release/pricing-engine` ali `target/release/pricing-engine.exe`

### Rust Calculation Failed

```
[PricingEngine] Rust calculation failed, falling back to TypeScript
```

**Rešitev:**
1. Preveri input format (ISO 8601 dates)
2. Preveri memory limits
3. Omogoči debug logging

### Force Rust Re-initialization

```typescript
import { reinitializeRustEngine } from '@/lib/tourism/pricing-engine-wrapper';

// After deploying new Rust binary
reinitializeRustEngine();
```

## Migration Guide

### Iz Starega Pattern-a

```diff
// Before: Manual Rust/TS selection
- import { calculatePrice as tsCalculate } from '@/lib/tourism/pricing-engine';
- import { calculatePrice as rustCalculate, RustPricingEngine } from '@/lib/tourism/pricing-engine-rust';
- 
- const engine = new RustPricingEngine();
- const useRust = engine.isAvailable();
- 
- const result = useRust
-   ? await rustCalculate(...)
-   : tsCalculate(...);

// After: Unified wrapper
+ import { calculatePrice } from '@/lib/tourism/pricing-engine-wrapper';
+ 
+ const result = await calculatePrice(...);
```

## Best Practices

1. ✅ **Vedno uporabi wrapper** - Nikoli direktno v Rust/TS engine
2. ✅ **Async/await** - Wrapper je async zaradi Rust engine-a
3. ✅ **Error handling** - Wrapper samodejno handle-a fallback
4. ✅ **Logging** - Uporabi `getEngineInfo()` za monitoring
5. ✅ **Testing** - Testiraj oba scenarija (Rust available/unavailable)

## Datoteke

```
src/lib/tourism/
├── pricing-engine.ts           # Original TypeScript implementation
├── pricing-engine-rust.ts      # Rust NAPI wrapper
├── pricing-engine-wrapper.ts   # ★ Unified API z fallback-om
└── __tests__/
    └── pricing-engine-wrapper.test.ts
```

## Povzetek

Ta pattern zagotavlja:
- ✅ **Performance** - Rust ko je na voljo
- ✅ **Reliability** - TypeScript fallback vedno deluje
- ✅ **Simplicity** - Enoten API za vse klice
- ✅ **Maintainability** - Centralizirana logika
- ✅ **Observability** - Easy monitoring z `getEngineInfo()`
