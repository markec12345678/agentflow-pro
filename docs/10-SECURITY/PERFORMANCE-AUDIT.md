# Performance Audit – Tourism Hub

Lighthouse baseline in cilji za tourism strani.

## Step-by-step runbook

1. **Build and start:**
   ```bash
   npm run build
   npm run start
   ```
2. Odpri `http://localhost:3002`, prijavi se.
3. Za vsako stran v spodnji tabeli:
   - Odpri URL
   - Chrome DevTools (F12) → Lighthouse tab
   - Run audit (Performance, Accessibility, Best Practices, SEO)
   - Zapiši rezultate v tabelo
4. **Mobile audit:** DevTools → Toggle device toolbar (Ctrl+Shift+M) → izberi 375px, nato 768px → ponovi Lighthouse

## Zaženi audit

```bash
npm run build
npm run start
```

Chrome DevTools → Lighthouse → Run audit (Performance, Accessibility, Best Practices, SEO).

## Cilji

- Performance ≥ 90
- Accessibility ≥ 90
- Best Practices ≥ 90
- SEO ≥ 90

## Rezultati (ročni audit)

| Stran | Performance | Accessibility | Best Practices | SEO |
|-------|-------------|---------------|----------------|-----|
| /dashboard/tourism | _todo_ | _todo_ | _todo_ | _todo_ |
| /dashboard/tourism/generate | _todo_ | _todo_ | _todo_ | _todo_ |
| /dashboard/tourism/landing | _todo_ | _todo_ | _todo_ | _todo_ |
| /dashboard/tourism/email | _todo_ | _todo_ | _todo_ | _todo_ |
| /dashboard/tourism/seo | _todo_ | _todo_ | _todo_ | _todo_ |
| /dashboard/tourism/translate | _todo_ | _todo_ | _todo_ | _todo_ |
| /dashboard/tourism/properties | _todo_ | _todo_ | _todo_ | _todo_ |
| /dashboard/tourism/templates | _todo_ | _todo_ | _todo_ | _todo_ |

## Optimizacije

- **Recharts**: Dinamični import na SEO strani za manjši initial bundle.
- **Skeleton**: Eksplicitne dimenzije (h-64, w-full) za zmanjšanje CLS.
- **Images**: Če so slike, uporabi next/image z optimizacijo.
