# Vercel Deployment Fixes

## Issues Fixed

### 1. TypeScript Error in workflow-executor
**Error:** `Property 'metadata' does not exist on type 'Partial<WorkflowDefinition>'`

**Fix:** Made `nodes` and `edges` optional in `WorkflowDefinition` interface and cast to `any` for metadata assignment.

- `rust/workflow-executor/index.d.ts`: Made `nodes` and `edges` optional
- `rust/workflow-executor/src/wrapper.ts`: Cast workflow to `any` for metadata

### 2. preinstall.js ESM Error
**Error:** `ReferenceError: require is not defined in ES module scope`

**Fix:** Changed `installCommand` to `npm install --ignore-scripts` to skip preinstall script from dependencies.

### 3. Missing DATABASE_URL
**Error:** `Cannot resolve environment variable: DATABASE_URL`

**Fix:** Added `npx prisma generate` to build command and documented required env vars.

## Required Vercel Environment Variables

Set these in **Vercel Dashboard → Project Settings → Environment Variables**:

### Required (Production)
```
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=https://your-domain.vercel.app
MOCK_MODE=false
NODE_ENV=production
RUST_ENABLED=false
SENTRY_DISABLE_SERVER_WEBPACK_PLUGIN=true
SENTRY_DISABLE_CLIENT_WEBPACK_PLUGIN=true
```

### Optional (Features)
```
STRIPE_SECRET_KEY=sk_...
OPENAI_API_KEY=sk-...
REDIS_URL=redis://...
QDRANT_URL=https://...
QDRANT_API_KEY=...
CRON_SECRET=your-cron-secret
```

## Deployment Steps

1. **Commit changes:**
   ```bash
   git add vercel.json rust/workflow-executor/index.d.ts rust/workflow-executor/src/wrapper.ts
   git commit -m "fix: vercel deployment - esm, typescript, and build issues"
   git push
   ```

2. **Set environment variables** in Vercel Dashboard

3. **Trigger redeploy** - Vercel will auto-deploy on push

4. **Verify build** - Check deployment logs for:
   - ✅ `npm install --ignore-scripts` succeeds
   - ✅ `npx prisma generate` succeeds
   - ✅ `npm run build` completes without TypeScript errors
   - ✅ Deployment status: **Ready**

## Local Testing

Test build locally before pushing:

```bash
# Set required env vars
export DATABASE_URL="postgresql://localhost:5432/agentflow"
export NEXTAUTH_SECRET="test-secret-at-least-32-chars-long"
export NEXTAUTH_URL="http://localhost:3002"

# Build
npm install --ignore-scripts
npx prisma generate
npm run build
```

## Troubleshooting

### Build still fails with TypeScript errors
Check `rust/workflow-executor/src/wrapper.ts` for any remaining type issues.

### Prisma generate fails
Ensure `DATABASE_URL` is set in Vercel environment variables.

### Runtime errors
Check Vercel Functions logs for missing environment variables.
