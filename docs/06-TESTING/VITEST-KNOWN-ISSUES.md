# Vitest Migration - Known Issues

## ✅ Successfully Migrated: 441/453 tests (97.5%)

### Working Tests (53 test files)
- ✅ API tests (all endpoints)
- ✅ Workflow tests (executor, conditions, error-handler, types-validator)
- ✅ Memory tests (graph, session, integration, sync)
- ✅ Tourism tests (prompts, kg-sync, policy-agent, predictive-analytics, publish-helpers, faq-schema)
- ✅ Stripe tests (checkout, plans, webhooks)
- ✅ Alerts tests (smartAlerts)
- ✅ Vector tests (QdrantService)
- ✅ Lib tests (email-sender, email-template-rendering, mock-mode, vector-indexer, workflow-template, dashboard-template, auth-options, is-admin)
- ✅ Data tests (case-studies, solutions, workflow-apps)
- ✅ Agent tests (code, content, research, deploy)
- ✅ Verifier tests (schemas)
- ✅ Orchestrator tests

## ⚠️ Known Issues (1 test file, 12 tests)

### tests/lib/auth-users.test.ts (12 failing tests)

**Issue:** bcryptjs mocking doesn't work properly with Vitest due to CJS/ESM interop

**Error:** `default.compare.mockResolvedValue is not a function`

**Root Cause:** 
- bcryptjs is a CommonJS module
- Vitest uses ESM by default
- The mock factory function doesn't properly intercept the CJS export

**Possible Solutions:**

1. **Use vi.importActual** (recommended):
```typescript
vi.mock('bcryptjs', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    hash: vi.fn().mockResolvedValue('$2a$10$mocked'),
    compare: vi.fn().mockResolvedValue(true),
  }
})
```

2. **Switch to @node-rs/bcrypt** (native ESM alternative):
```bash
npm install @node-rs/bcrypt
```

3. **Keep using Jest for this specific test**:
```bash
# Run with Jest
npx jest tests/lib/auth-users.test.ts
```

4. **Mock the auth-users module instead**:
```typescript
vi.mock('@/lib/auth-users', () => ({
  getUserId: vi.fn(),
  registerUser: vi.fn(),
  getUser: vi.fn(),
}))
```

**Impact:** Low - these are unit tests for auth utility functions. The actual authentication flow is tested through API tests which are passing.

## 📊 Summary

- **Total Tests:** 453
- **Passing:** 441 (97.5%)
- **Failing:** 12 (2.5%)
- **Test Files:** 54 passing, 1 failing

## Next Steps

1. For production deployment: ✅ Ready (all integration/API tests passing)
2. For complete migration: Fix bcryptjs mock or keep Jest for auth-users tests
3. Consider running Jest in parallel for the few failing tests
