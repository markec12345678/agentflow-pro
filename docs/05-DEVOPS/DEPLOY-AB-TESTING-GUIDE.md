# 🚀 AgentFlow Pro - Deployment & A/B Testing Guide

## 📋 Kazalo

1. [Hitri Deploy (Danes)](#1-hitri-deploy-danes)
2. [A/B Testiranje (Ta Teden)](#2-ab-testiranje-ta-teden)
3. [Analytics Setup](#3-analytics-setup)
4. [Results Dashboard](#4-results-dashboard)

---

## 1️⃣ Hitri Deploy (Danes)

### Korak 1: Pripravi Datoteke

```powershell
# Zaženi deployment skripto
.\deploy-landing-page.ps1
```

To bo:
- ✅ Ustvaril `public/promo/` mapo
- ✅ Kopiral video: `agentflow-pro-promo.mp4`
- ✅ Kopiral sliko: `agentflow-pro-promo-2025.png`
- ✅ Posodobil video path v landing page-u
- ✅ Odprl preview v brskalniku

### Korak 2: Dodaj React Komponento

```bash
# Kopiraj HeroSection komponento v tvoj projekt
copy HeroSection.tsx src\components\HeroSection.tsx
```

### Korak 3: Posodobi Landing Page

```tsx
// src/app/page.tsx
import HeroSection from '@/components/HeroSection';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
    </main>
  );
}
```

### Korak 4: Deployaj na Vercel

```bash
# Preveri če so vse spremembe commitane
git status

# Commitaj
git add .
git commit -m "🎨 Add promotional materials and landing page"

# Deployaj
vercel --prod
```

### Korak 5: Testiraj Live Site

```bash
# Odpri production URL
start https://agentflow-pro.vercel.app
```

---

## 2️⃣ A/B Testiranje (Ta Teden)

### Kaj Testiramo?

| Metrika | Variant A (Original) | Variant B (Electric Indigo) |
|---------|---------------------|----------------------------|
| **Design** | Trenutni | Novi 2025 trends |
| **Barve** | Generic Blue | Electric Indigo (#6F00FF) |
| **Layout** | Single Column | Bento Grid |
| **Video** | Static Image | 5s Loop Animation |
| **CTA** | Standard | High Contrast + Glow |

### Namesti A/B Testing Framework

#### Korak 1: Dodaj Prisma Schema

```prisma
// prisma/schema.prisma

// A/B Testing Events
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

#### Korak 2: Run Migration

```bash
npx prisma migrate dev --name add-ab-testing
```

#### Korak 3: Ustvari API Route

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
    console.error('A/B Test Error:', error);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
```

#### Korak 4: Implementiraj A/B Test na Landing Page

```tsx
// src/app/page.tsx
'use client';

import { useState, useEffect } from 'react';
import OriginalHero from '@/components/OriginalHero';
import ElectricIndigoHero from '@/components/HeroSection';

export default function HomePage() {
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Random variant assignment
    const stored = localStorage.getItem('ab_test_hero');
    if (stored) {
      setVariant(stored as 'A' | 'B');
    } else {
      const newVariant = Math.random() < 0.5 ? 'A' : 'B';
      localStorage.setItem('ab_test_hero', newVariant);
      setVariant(newVariant);
    }
    setLoaded(true);
    
    // Track impression
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: 'hero-redesign-2025',
        variant: variant,
        event: 'impression',
        timestamp: new Date().toISOString(),
      }),
    });
  }, []);

  const trackClick = () => {
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        testId: 'hero-redesign-2025',
        variant,
        event: 'click',
        timestamp: new Date().toISOString(),
      }),
    });
  };

  if (!loaded) return <div>Loading...</div>;

  return variant === 'A' ? (
    <OriginalHero onCtaClick={trackClick} />
  ) : (
    <ElectricIndigoHero onCtaClick={trackClick} />
  );
}
```

---

## 3️⃣ Analytics Setup

### Google Analytics (Optional)

```tsx
// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### .env.local Variables

```env
# Google Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Vercel Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxxxxx
```

---

## 4️⃣ Results Dashboard

### Ustvari Dashboard Stran

```tsx
// src/app/dashboard/ab-testing/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function ABTestDashboard() {
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    fetch('/api/analytics/ab-test/results?testId=hero-redesign-2025')
      .then(res => res.json())
      .then(data => setResults(data))
      .catch(console.error);
  }, []);

  if (!results) return <div>Loading results...</div>;

  return (
    <div style={{ padding: '40px' }}>
      <h1>A/B Test Results: Hero Redesign 2025</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Variant A */}
        <div style={{ padding: '30px', background: '#1e293b', borderRadius: '12px' }}>
          <h2>Variant A (Original)</h2>
          <p>Impressions: {results.variantA.impressions}</p>
          <p>CTR: {results.variantA.ctr}%</p>
          <p>Conversion Rate: {results.variantA.conversionRate}%</p>
        </div>
        
        {/* Variant B */}
        <div style={{ padding: '30px', background: '#1e293b', borderRadius: '12px' }}>
          <h2>Variant B (Electric Indigo)</h2>
          <p>Impressions: {results.variantB.impressions}</p>
          <p>CTR: {results.variantB.ctr}%</p>
          <p>Conversion Rate: {results.variantB.conversionRate}%</p>
        </div>
      </div>
      
      {results.winner && (
        <div style={{ 
          marginTop: '40px', 
          padding: '30px', 
          background: 'linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(16,185,129,0.1) 100%)',
          border: '2px solid #10b981',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '28px', color: '#10b981' }}>
            🏆 Winner: Variant {results.winner.variant}
          </h2>
          <p style={{ color: '#94A3B8' }}>
            {results.winner.improvement}% higher conversion rate
          </p>
        </div>
      )}
    </div>
  );
}
```

---

## 📊 Metrike Za Spremljanje

### Daily Check:

```bash
# Odpri dashboard
start https://agentflow-pro.vercel.app/dashboard/ab-testing
```

### Ključne Metrike:

| Metrika | Formula | Target |
|---------|---------|--------|
| **CTR** | (Clicks / Impressions) × 100 | > 5% |
| **Conversion Rate** | (Signups / Clicks) × 100 | > 20% |
| **Time on Page** | Average session duration | > 30s |
| **Bounce Rate** | (Single page visits / Total) × 100 | < 40% |

### Statistical Significance:

```typescript
// Izračun confidence levela
function calculateConfidence(variantA: number, variantB: number): number {
  const zScore = Math.abs(variantA - variantB) / 
                 Math.sqrt((variantA * (1 - variantA) / 1000) + 
                          (variantB * (1 - variantB) / 1000));
  
  // Convert z-score to confidence percentage
  return (0.5 * (1 + Math.erf(zScore / Math.sqrt(2)))) * 100;
}
```

**Minimum za significance:** 95% confidence

---

## 🎯 Timeline

### Dan 1 (Danes):
- [x] Pripravi promotional materials
- [ ] Deployaj landing page
- [ ] Testiraj video load
- [ ] Preveri mobile responsive

### Dan 2-3:
- [ ] Namesti A/B testing framework
- [ ] Dodaj analytics tracking
- [ ] Launch test (50/50 split)

### Dan 4-7:
- [ ] Zberi podatke (min. 1000 impressions)
- [ ] Analiziraj rezultate
- [ ] Izberi winnerja

### Dan 8:
- [ ] Implementiraj winning variant
- [ ] Remove A/B testing code
- [ ] Full rollout

---

## 🚀 Quick Commands

```bash
# Deploy
vercel --prod

# Check analytics
curl https://agentflow-pro.vercel.app/api/analytics/ab-test/results?testId=hero-redesign-2025

# Local test
npm run dev
start http://localhost:3002
```

---

## 📞 Support

Če rabiš pomoč:
1. Preveri [A/B Testing Documentation](./ab-testing-framework.ts)
2. Odpri issue na GitHub
3. Kontaktiraj team na Slack

---

**Good luck with the launch! 🎉**
