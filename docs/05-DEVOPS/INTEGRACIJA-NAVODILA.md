# 🚀 Integracija HeroSection v page.tsx

## ✅ Kaj Je Že Narejeno:

- [x] Deploy skripta zagnana
- [x] Video kopiran v `public/promo/`
- [x] Slika kopirana v `public/promo/`
- [x] HeroSection.tsx kopiran v `src/components/`
- [x] Backup narejen: `src/app/page.tsx.backup`

---

## 📝 Navodila Za Integracijo:

### Opcija 1: Samodejna Integracija (Priporočeno)

```powershell
# Zaženi to skripto
.\integrate-hero-section.ps1
```

### Opcija 2: Ročna Integracija

#### 1. Odpri `src/app/page.tsx`

```bash
code src/app/page.tsx
```

#### 2. Zamenjaj Vsebino S Tem:

```tsx
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
```

#### 3. Shrani in Testiraj

```bash
npm run dev
```

---

## 🧪 Testiraj:

### 1. Lokalno:

```bash
npm run dev
start http://localhost:3002
```

### 2. Preveri:

- [ ] Video se avtomatsko predvaja
- [ ] CTA gumbi delujejo
- [ ] Bento grid je responsive
- [ ] Micro-interactions delujejo
- [ ] Mobile responsive (F12 → mobile view)

---

## 🚀 Deployaj:

### 1. Commitaj:

```bash
git add .
git commit -m "🎨 Launch new hero section with video and A/B testing"
```

### 2. Deployaj na Vercel:

```bash
vercel --prod
```

### 3. Odpri Live Site:

```bash
start https://agentflow-pro.vercel.app
```

---

## 📊 A/B Testing (Optional):

Če želiš vklopiti A/B testing:

### 1. Namesti Prisma Schema:

```prisma
// prisma/schema.prisma
model ABTestEvent {
  id        String   @id @default(cuid())
  testId    String
  variant   String
  eventType String
  timestamp DateTime
  userAgent String?
  pathname  String?
  
  @@index([testId])
  @@index([variant])
  @@index([timestamp])
}
```

### 2. Run Migration:

```bash
npx prisma migrate dev --name add-ab-testing
```

### 3. Ustvari API Route:

```typescript
// src/app/api/analytics/ab-test/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    await prisma.abTestEvent.create({
      data: {
        testId: data.testId,
        variant: data.variant,
        eventType: data.event,
        timestamp: new Date(data.timestamp),
        userAgent: data.userAgent,
        pathname: data.pathname,
      },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
```

### 4. Posodobi HeroSection:

```tsx
// src/components/HeroSection.tsx
'use client';

import { useABTest } from '@/lib/ab-testing';

export default function HeroSection() {
  const { variant, loaded, trackEvent } = useABTest();
  
  if (!loaded) return <div>Loading...</div>;
  
  return variant === 'A' ? (
    <OriginalHero onCtaClick={() => trackEvent('click')} />
  ) : (
    <ElectricIndigoHero onCtaClick={() => trackEvent('click')} />
  );
}
```

---

## 🎯 Checklist:

### Danes:
- [ ] Integriraj HeroSection
- [ ] Testiraj lokalno
- [ ] Commitaj
- [ ] Deployaj

### Ta Teden:
- [ ] Namesti A/B testing
- [ ] Launch test (50/50 split)
- [ ] Zberi podatke

### Naslednji Teden:
- [ ] Analiziraj rezultate
- [ ] Izberi winnerja
- [ ] Full rollout

---

## 📞 Pomoč:

Če kaj ne deluje:
1. Preveri console (F12)
2. Preveri video path: `/promo/agentflow-pro-promo.mp4`
3. Preveri če je komponenta uvožena: `import HeroSection from '@/components/HeroSection'`
4. Restartaj dev server: `npm run dev`

---

**Good luck! 🚀**
