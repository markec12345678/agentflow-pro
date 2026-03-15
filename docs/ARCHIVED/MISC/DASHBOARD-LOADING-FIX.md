# 🔧 Dashboard Loading Issues - Diagnostic & Fix Guide

## Problem
Dashboard interfaces not loading (`vmesniki dashboardsi se ne nalozijo`)

## Root Causes Identified

### 1. **Database Connection Issue** (Most Likely)
- `/api/dashboard/boot` endpoint requires PostgreSQL database connection
- Missing or incorrect `DATABASE_URL` in `.env` file
- Database not running or inaccessible

### 2. **Authentication Required**
- Dashboard routes require user session
- NextAuth session not properly configured
- Missing `NEXTAUTH_SECRET` or `NEXTAUTH_URL`

### 3. **API Endpoint Errors**
- TypeScript compilation errors in API routes
- Missing dependencies or imports
- Prisma client not generated

### 4. **Frontend Loading States**
- Components stuck in loading state due to API timeouts
- Network requests failing silently
- JavaScript errors blocking render

---

## 🚀 Quick Fix Steps

### Step 1: Check Environment Variables

Create or update your `.env` file:

```bash
# Minimum required for dashboard to load:
DATABASE_URL="postgresql://postgres:password@localhost:5432/agentflow"
NEXTAUTH_SECRET="your-32-char-secret-key-here-change-this"
NEXTAUTH_URL="http://localhost:3002"
MOCK_MODE="true"
```

**Generate NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### Step 2: Verify Database Connection

Run the database check script:

```bash
# PowerShell
node scripts/check-database.js

# Or with TypeScript
npx ts-node scripts/check-database.ts
```

**Expected output:**
```
✅ DATABASE_URL is set
✅ Using PostgreSQL database
DATABASE_URL: postgresql://...
✅ Database connection successful
```

**If you see errors:**
1. Install PostgreSQL locally or use cloud service (Supabase, Neon)
2. Update `DATABASE_URL` with correct credentials
3. Run migrations: `npm run db:migrate`

### Step 3: Install Dependencies & Generate Prisma

```bash
# Install all dependencies
npm install

# Generate Prisma client
npm run db:generate

# Seed database (optional - adds test data)
npm run db:seed
```

### Step 4: Start Development Server

```bash
# Clean build
npm run clean
npm run dev
```

Server should start on `http://localhost:3002`

### Step 5: Test Dashboard Access

Navigate to:
- `http://localhost:3002/dashboard` → Should redirect to login or show tourism dashboard
- `http://localhost:3002/api/dashboard/boot` → Should return JSON (if authenticated) or 401

---

## 🔍 Detailed Diagnostics

### Run Comprehensive Test Script

```bash
# Install Playwright if not already
npx playwright install

# Run diagnostic script
npx tsx scripts/diagnose-dashboard-loading.ts
```

This will:
1. Test all dashboard routes
2. Check API endpoints
3. Capture screenshots
4. Log all errors
5. Generate detailed report

### Manual API Testing

Test the boot API directly:

```bash
# Without auth (should return 401)
curl http://localhost:3002/api/dashboard/boot

# With auth cookie (from browser dev tools)
curl http://localhost:3002/api/dashboard/boot \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"
```

**Expected responses:**

**Without auth:**
```json
{
  "error": "Unauthorized"
}
```

**With auth:**
```json
{
  "profile": { "onboarding": { "industry": "tourism" } },
  "usage": { ... },
  "activePropertyId": null,
  "hasProperty": false,
  ...
}
```

---

## 🐛 Common Error Scenarios

### Error: "Prisma Client is not imported"

**Fix:**
```bash
npm run db:generate
```

### Error: "connect ECONNREFUSED 127.0.0.1:5432"

**Meaning:** PostgreSQL not running on localhost:5432

**Solutions:**
1. **Local PostgreSQL:**
   ```bash
   # Windows (check service)
   Get-Service -Name postgresql*
   
   # Start PostgreSQL service
   Start-Service postgresql-x64-14
   ```

2. **Use Supabase (recommended for development):**
   - Go to https://supabase.com
   - Create new project
   - Copy connection string
   - Update `.env`:
     ```
     DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"
     ```

### Error: "Invalid NEXTAUTH_SECRET"

**Fix:**
```bash
# Generate new secret
openssl rand -base64 32

# Update .env
NEXTAUTH_SECRET="output-from-above-command"
```

### Dashboard loads but shows "Loading..." forever

**Causes:**
1. API timeout (8 second default)
2. JavaScript error blocking render
3. Network request failures

**Debug:**
1. Open browser DevTools → Console
2. Look for red errors
3. Check Network tab for failed requests
4. Look for `/api/dashboard/boot` status

**Fix:**
- Check server logs for API errors
- Verify database has required tables
- Ensure Prisma schema is migrated

### Blank page / White screen

**Check:**
1. Browser console for errors
2. Server terminal for compilation errors
3. Next.js build logs

**Common fixes:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules/.cache
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

---

## 📊 Dashboard Routes Checklist

Test each route manually:

| Route | Status | Notes |
|-------|--------|-------|
| `/dashboard` | ⬜ | Main entry point |
| `/dashboard/tourism` | ⬜ | Tourism hub (default for tourism users) |
| `/dashboard/receptor` | ⬜ | Reception mode |
| `/dashboard/properties` | ⬜ | Property management |
| `/dashboard/tourism/calendar` | ⬜ | Calendar view |
| `/dashboard/workflows` | ⬜ | Workflow builder |
| `/dashboard/settings` | ⬜ | Settings |
| `/dashboard/insights` | ⬜ | Analytics |
| `/dashboard/mcp-builder` | ⬜ | MCP builder |
| `/dashboard/page-builder` | ⬜ | Page builder |

**Mark status:**
- ✅ Working correctly
- ⚠️ Partial working (show specific issue)
- ❌ Not working (show error message)
- ⏳ Stuck in loading state

---

## 🛠️ Advanced Troubleshooting

### Enable Debug Logging

Add to `.env`:
```bash
DEBUG=true
LOG_LEVEL=debug
```

Check server logs for:
```bash
# In terminal where npm run dev is running
# Look for lines with:
# - "Dashboard boot"
# - "API route"
# - "Prisma"
# - "Error"
```

### Database Schema Validation

Ensure all required tables exist:

```sql
-- Connect to your database
psql -U postgres -d agentflow

-- List all tables
\dt

-- Should include:
# User, Account, Session, VerificationToken
# Onboarding, Property, Booking, ContentHistory
# WorkflowCheckpoint, SmartAlertLog, etc.
```

If tables are missing:
```bash
npm run db:migrate
npm run db:push
```

### Network Request Analysis

Open browser DevTools → Network tab:

1. Filter by: `dashboard` or `api`
2. Look for:
   - Failed requests (red)
   - Long response times (>5s)
   - 4xx or 5xx status codes
   
3. Click on `/api/dashboard/boot` request
4. Check:
   - **Headers**: Status code, cookies
   - **Response**: JSON payload
   - **Timing**: DNS lookup, TCP connection, SSL, TTFB

### Component-Level Debugging

Add logging to dashboard layout:

```typescript
// src/app/dashboard/layout.tsx - line 158
useEffect(() => {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 8000);
  
  console.log('[Dashboard Layout] Fetching boot data...');
  
  fetch("/api/dashboard/boot", { signal: ctrl.signal })
    .then((r) => {
      console.log('[Dashboard Layout] Boot response:', r.status);
      return r.json();
    })
    .then((data) => {
      console.log('[Dashboard Layout] Boot data:', data);
      setUserIndustry(data?.profile?.onboarding?.industry ?? null);
    })
    .catch((e) => {
      console.error('[Dashboard Layout] Boot error:', e);
      setUserIndustry(null);
    })
    .finally(() => clearTimeout(t));
}, []);
```

Then check browser console for these logs.

---

## ✅ Success Criteria

Dashboard is considered working when:

1. ✅ Page loads in < 3 seconds
2. ✅ No console errors
3. ✅ All KPI cards display data
4. ✅ Sidebar navigation visible and functional
5. ✅ No infinite loading states
6. ✅ API `/api/dashboard/boot` returns valid JSON
7. ✅ Can navigate to sub-pages (tourism, receptor, properties)
8. ✅ Dark mode toggle works
9. ✅ Mobile responsive design works

---

## 📞 Next Steps After Fixing

Once dashboards load successfully:

1. **Test user flows:**
   - Login → Dashboard → Tourism → Calendar
   - Create property → View in dashboard
   - Generate content → See in recent activity

2. **Verify data persistence:**
   - Create booking → Refresh → Still exists
   - Update settings → Navigate away → Back → Settings saved

3. **Test edge cases:**
   - Empty states (new user with no data)
   - Error states (disconnect network temporarily)
   - Loading states (simulate slow connection)

4. **Performance check:**
   - Lighthouse score > 90
   - Time to Interactive < 2.5s
   - No memory leaks (check DevTools Memory tab)

---

## 🆘 Still Having Issues?

If problems persist after following all steps:

1. **Collect diagnostics:**
   ```bash
   # Run full diagnostic
   npx tsx scripts/diagnose-dashboard-loading.ts
   
   # Check generated report
   cat screenshots/dashboard-diagnostic/diagnostic-report.json
   ```

2. **Share these details:**
   - Operating system and version
   - Node.js version (`node --version`)
   - npm version (`npm --version`)
   - PostgreSQL version (if local)
   - Database provider (local, Supabase, Neon, etc.)
   - Full error messages from console
   - Screenshots from diagnostic script
   - `.env` file contents (remove sensitive values)

3. **Common escalation paths:**
   - Database connection issues → Check PostgreSQL logs
   - Authentication issues → Review NextAuth configuration
   - Frontend rendering → Check React hydration errors
   - API failures → Review server terminal logs

---

## 📝 Maintenance

To prevent future dashboard loading issues:

1. **Regular updates:**
   ```bash
   # Weekly
   npm install  # Update dependencies
   
   # After schema changes
   npm run db:migrate
   npm run db:generate
   ```

2. **Pre-commit checks:**
   ```bash
   # Runs automatically via Husky
   npm run precommit
   ```

3. **Production deployment checklist:**
   - [ ] All tests passing
   - [ ] Database migrations applied
   - [ ] Environment variables set in production
   - [ ] Build completes without errors
   - [ ] Smoke tests pass in staging
   - [ ] Monitoring enabled (Sentry, analytics)

---

**Last Updated:** 2026-03-12  
**Status:** Active troubleshooting guide
