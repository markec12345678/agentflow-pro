/**
 * AgentFlow Pro - A/B Testing Framework
 * 
 * Features:
 * - Track CTR, conversion rate, time on page, bounce rate
 * - Variant A (Original) vs Variant B (Electric Indigo)
 * - Automatic variant assignment
 * - Analytics integration
 * - Results dashboard
 */

'use client';

import { useEffect, useState } from 'react';

// A/B Test Configuration
export const AB_TEST_CONFIG = {
  testId: 'hero-redesign-2025',
  variants: {
    A: { name: 'Original Design', weight: 0.5 },
    B: { name: 'Electric Indigo Design', weight: 0.5 },
  },
  metrics: ['ctr', 'conversion', 'timeOnPage', 'bounceRate'],
  sampleSize: 1000, // Statistical significance target
};

// Track which variant user sees
export function useABTest() {
  const [variant, setVariant] = useState<'A' | 'B'>('A');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Check if user already has assigned variant
    const storedVariant = localStorage.getItem(`ab_test_${AB_TEST_CONFIG.testId}`);
    
    if (storedVariant) {
      setVariant(storedVariant as 'A' | 'B');
    } else {
      // Randomly assign variant based on weight
      const random = Math.random();
      const assignedVariant = random < AB_TEST_CONFIG.variants.B.weight ? 'B' : 'A';
      
      localStorage.setItem(`ab_test_${AB_TEST_CONFIG.testId}`, assignedVariant);
      setVariant(assignedVariant);
    }
    
    setLoaded(true);
    
    // Track impression
    trackEvent('impression', variant);
  }, []);

  // Track custom events
  const trackEvent = (eventType: string, variantOverride?: string) => {
    const currentVariant = variantOverride || variant;
    
    const eventData = {
      event: eventType,
      variant: currentVariant,
      testId: AB_TEST_CONFIG.testId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      pathname: window.location.pathname,
    };
    
    // Send to analytics endpoint
    fetch('/api/analytics/ab-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    }).catch(console.error);
    
    // Also send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', `ab_test_${eventType}`, {
        event_category: 'ab_test',
        event_label: AB_TEST_CONFIG.testId,
        variant: currentVariant,
      });
    }
  };

  return { variant, loaded, trackEvent };
}

// Analytics API Route Handler (save to /src/app/api/analytics/ab-test/route.ts)
export const API_ROUTE_HANDLER = `
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/infrastructure/database/prisma';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    
    // Save to database
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
    console.error('A/B Test Analytics Error:', error);
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 });
  }
}
`;

// Prisma Schema Addition (add to prisma/schema.prisma)
export const PRISMA_SCHEMA = `
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
`;

// Results Dashboard Component
export function ABTestDashboard() {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/analytics/ab-test/results?testId=hero-redesign-2025')
      .then(res => res.json())
      .then(data => {
        setResults(data);
        setLoading(false);
      })
      .catch(console.error);
  }, []);

  if (loading) return <div>Loading results...</div>;
  if (!results) return <div>No data available</div>;

  return (
    <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '40px' }}>
        A/B Test Results: {results.testId}
      </h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
        {/* Variant A Stats */}
        <div style={{ padding: '30px', background: '#1e293b', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '20px' }}>
            Variant A (Original)
          </h2>
          <StatRow label="Impressions" value={results.variantA.impressions} />
          <StatRow label="Clicks" value={results.variantA.clicks} />
          <StatRow label="CTR" value={`${results.variantA.ctr}%`} highlight />
          <StatRow label="Conversions" value={results.variantA.conversions} />
          <StatRow label="Conversion Rate" value={`${results.variantA.conversionRate}%`} highlight />
          <StatRow label="Avg Time on Page" value={`${results.variantA.avgTimeOnPage}s`} />
          <StatRow label="Bounce Rate" value={`${results.variantA.bounceRate}%`} />
        </div>
        
        {/* Variant B Stats */}
        <div style={{ padding: '30px', background: '#1e293b', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '24px', color: 'white', marginBottom: '20px' }}>
            Variant B (Electric Indigo)
          </h2>
          <StatRow label="Impressions" value={results.variantB.impressions} />
          <StatRow label="Clicks" value={results.variantB.clicks} />
          <StatRow label="CTR" value={`${results.variantB.ctr}%`} highlight />
          <StatRow label="Conversions" value={results.variantB.conversions} />
          <StatRow label="Conversion Rate" value={`${results.variantB.conversionRate}%`} highlight />
          <StatRow label="Avg Time on Page" value={`${results.variantB.avgTimeOnPage}s`} />
          <StatRow label="Bounce Rate" value={`${results.variantB.bounceRate}%`} />
        </div>
      </div>
      
      {/* Winner Announcement */}
      {results.winner && (
        <div style={{ 
          marginTop: '40px', 
          padding: '30px', 
          background: results.winner.variant === 'B' 
            ? 'linear-gradient(135deg, rgba(111,0,255,0.2) 0%, rgba(34,211,238,0.2) 100%)'
            : 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(147,51,234,0.2) 100%)',
          border: '2px solid #10b981',
          borderRadius: '12px',
          textAlign: 'center',
        }}>
          <h2 style={{ fontSize: '28px', color: '#10b981', marginBottom: '10px' }}>
            🏆 Winner: Variant {results.winner.variant}
          </h2>
          <p style={{ color: '#94A3B8', fontSize: '16px' }}>
            {results.winner.improvement}% higher conversion rate with {results.winner.confidence}% confidence
          </p>
        </div>
      )}
    </div>
  );
}

function StatRow({ label, value, highlight = false }: { 
  label: string; 
  value: string | number; 
  highlight?: boolean;
}) {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      padding: '10px 0',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
    }}>
      <span style={{ color: '#94A3B8' }}>{label}</span>
      <span style={{ 
        color: highlight ? '#10b981' : 'white',
        fontWeight: highlight ? 'bold' : 'normal',
        fontSize: highlight ? '20px' : '16px',
      }}>
        {value}
      </span>
    </div>
  );
}

// Migration Script (run with: node scripts/migrate-ab-test.js)
export const MIGRATION_SCRIPT = `
// scripts/migrate-ab-test.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrate() {
  console.log('🔄 Running A/B Test migration...');
  
  await prisma.$executeRaw\`
    CREATE TABLE IF NOT EXISTS "ABTestEvent" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "testId" TEXT NOT NULL,
      "variant" TEXT NOT NULL,
      "eventType" TEXT NOT NULL,
      "timestamp" TIMESTAMP(3) NOT NULL,
      "userAgent" TEXT,
      "pathname" TEXT
    )
  \`;
  
  await prisma.$executeRaw\`
    CREATE INDEX IF NOT EXISTS "ABTestEvent_testId_idx" ON "ABTestEvent"("testId")
  \`;
  
  await prisma.$executeRaw\`
    CREATE INDEX IF NOT EXISTS "ABTestEvent_variant_idx" ON "ABTestEvent"("variant")
  \`;
  
  await prisma.$executeRaw\`
    CREATE INDEX IF NOT EXISTS "ABTestEvent_timestamp_idx" ON "ABTestEvent"("timestamp")
  \`;
  
  console.log('✅ Migration complete!');
  await prisma.$disconnect();
}

migrate().catch(console.error);
`;

// Usage Example in page.tsx
export const USAGE_EXAMPLE = `
// src/app/page.tsx
import HeroSection from '@/HeroSection';
import { useABTest } from '@/lib/ab-testing';

export default function HomePage() {
  const { variant, loaded, trackEvent } = useABTest();
  
  if (!loaded) return <div>Loading...</div>;
  
  return (
    <main>
      {variant === 'A' ? (
        <OriginalHeroSection onCtaClick={() => trackEvent('click')} />
      ) : (
        <ElectricIndigoHeroSection onCtaClick={() => trackEvent('click')} />
      )}
    </main>
  );
}
`;

console.log('✅ A/B Testing Framework Ready!');
console.log('');
console.log('📋 Installation Steps:');
console.log('');
console.log('1. Add Prisma schema:');
console.log('   Copy PRISMA_SCHEMA to prisma/schema.prisma');
console.log('   Run: npx prisma migrate dev --name add-ab-testing');
console.log('');
console.log('2. Create API route:');
console.log('   Save API_ROUTE_HANDLER to src/app/api/analytics/ab-test/route.ts');
console.log('');
console.log('3. Run migration:');
console.log('   Save MIGRATION_SCRIPT to scripts/migrate-ab-test.js');
console.log('   Run: node scripts/migrate-ab-test.js');
console.log('');
console.log('4. Update landing page:');
console.log('   Import useABTest hook in your page.tsx');
console.log('   See USAGE_EXAMPLE for implementation');
console.log('');
console.log('5. View results:');
console.log('   Navigate to /dashboard/ab-testing');
console.log('');
console.log('🚀 Ready to track A/B test performance!');
