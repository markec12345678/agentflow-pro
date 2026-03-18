/**
 * Performance Optimization Guidelines
 * 
 * Best practices for optimal AgentFlow Pro performance
 */

// ============================================================================
// 1. CODE SPLITTING & LAZY LOADING
// ============================================================================

/**
 * Use dynamic imports for heavy components
 * Example:
 */
/*
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Disable SSR if not needed
});
*/

// ============================================================================
// 2. IMAGE OPTIMIZATION
// ============================================================================

/**
 * Always use Next.js Image component
 * 
 * BEFORE:
 * <img src="/large-image.jpg" alt="Description" />
 * 
 * AFTER:
 * import Image from 'next/image';
 * <Image 
 *   src="/large-image.jpg" 
 *   alt="Description"
 *   width={800}
 *   height={600}
 *   loading="lazy"
 *   quality={75}
 *   priority={false} // Set true only for above-fold images
 * />
 */

// ============================================================================
// 3. DATABASE OPTIMIZATION
// ============================================================================

/**
 * Use Prisma query optimization
 * 
 * BEFORE:
 * const users = await prisma.user.findMany();
 * const posts = await prisma.post.findMany({ where: { userId: user.id } });
 * 
 * AFTER:
 * const users = await prisma.user.findMany({
 *   include: { posts: true },
 *   take: 20,
 *   skip: 0,
 * });
 */

/**
 * Add database indexes in schema.prisma:
 * 
 * model User {
 *   id    String @id @default(cuid())
 *   email String @unique
 *   @@index([email])
 *   @@index([createdAt])
 * }
 */

// ============================================================================
// 4. API OPTIMIZATION
// ============================================================================

/**
 * Implement caching for expensive operations
 * 
 * import { cache } from 'react';
 * 
 * const getExpensiveData = cache(async () => {
 *   // Expensive operation
 * });
 */

/**
 * Use React Query for client-side caching:
 * 
 * import { useQuery } from '@tanstack/react-query';
 * 
 * useQuery({
 *   queryKey: ['users'],
 *   queryFn: getUsers,
 *   staleTime: 5 * 60 * 1000, // 5 minutes
 * });
 */

// ============================================================================
// 5. BUNDLE SIZE OPTIMIZATION
// ============================================================================

/**
 * Import only what you need from libraries
 * 
 * BEFORE:
 * import _ from 'lodash';
 * import { format } from 'date-fns';
 * 
 * AFTER:
 * import debounce from 'lodash/debounce';
 * import { format } from 'date-fns/format';
 */

/**
 * Use tree-shakeable icon libraries:
 * 
 * BEFORE:
 * import { HomeIcon, UserIcon } from 'heroicons/react';
 * 
 * AFTER:
 * import { Home, User } from 'lucide-react';
 */

// ============================================================================
// 6. CSS OPTIMIZATION
// ============================================================================

/**
 * Use Tailwind's purge feature (already configured)
 *
 * tailwind.config.js content setting purges unused CSS classes
 */

/**
 * Avoid inline styles, use Tailwind classes instead
 */

// ============================================================================
// 7. SERVER COMPONENTS
// ============================================================================

/**
 * Use Server Components by default
 * 
 * 'use client'; // Only add when you need hooks, state, or browser APIs
 * 
 * Benefits:
 * - Zero bundle size for server components
 * - Direct backend data access
 * - Automatic code splitting
 */

// ============================================================================
// 8. STREAMING & SUSPENSE
// ============================================================================

/**
 * Use Suspense for progressive loading:
 * 
 * import { Suspense } from 'react';
 * 
 * <Suspense fallback={<Loading />}>
 *   <HeavyComponent />
 * </Suspense>
 */

// ============================================================================
// 9. CACHING STRATEGIES
// ============================================================================

/**
 * HTTP Cache Headers:
 * 
 * export async function GET() {
 *   return NextResponse.json(data, {
 *     headers: {
 *       'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
 *     },
 *   });
 * }
 */

/**
 * Redis Cache (Upstash):
 * 
 * import { Redis } from '@upstash/redis';
 * 
 * const redis = new Redis({ url, token });
 * 
 * // Cache for 1 hour
 * await redis.setex(`key:${id}`, 3600, JSON.stringify(data));
 * const cached = await redis.get(`key:${id}`);
 */

// ============================================================================
// 10. MONITORING & PROFILING
// ============================================================================

/**
 * Use Next.js built-in profiling:
 * 
 * npm run analyze
 * 
 * Use React DevTools Profiler
 * Use Chrome DevTools Performance tab
 * Use Lighthouse for audits
 */

/**
 * Monitor with Sentry:
 * 
 * import * as Sentry from '@sentry/nextjs';
 * 
 * Sentry.startSpan({
 *   name: 'My Database Query',
 *   op: 'db.query',
 * }, async () => {
 *   // Your code
 * });
 */

// ============================================================================
// PERFORMANCE CHECKLIST
// ============================================================================

/**
 * Pre-deployment checklist:
 * 
 * [ ] Bundle size < 200KB (gzipped)
 * [ ] First Contentful Paint < 1.5s
 * [ ] Time to Interactive < 3.5s
 * [ ] Cumulative Layout Shift < 0.1
 * [ ] Lighthouse score > 90
 * [ ] All images optimized (WebP/AVIF)
 * [ ] All routes use lazy loading
 * [ ] Database queries optimized with indexes
 * [ ] API responses cached
 * [ ] Unused dependencies removed
 * [ ] Source maps disabled in production
 * [ ] Compression enabled (gzip/brotli)
 */

// ============================================================================
// USEFUL COMMANDS
// ============================================================================

/**
 * Analyze bundle:
 * npm run analyze
 * 
 * Check performance:
 * npm run dev
 * Open Chrome DevTools > Lighthouse > Analyze
 * 
 * Check bundle size:
 * npm install -g webpack-bundle-analyzer
 * npm run build
 * 
 * Monitor dependencies:
 * npm audit
 * npm outdated
 */

export {};
