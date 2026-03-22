# 🧪 AgentFlow Pro - E2E Testing Guide

## Quick Start

### 1. Unregister Service Worker (IMPORTANT!)
Before running tests, unregister old Service Workers:

**In Browser Console (F12):**
```javascript
navigator.serviceWorker.getRegistrations().then(r => r.forEach(reg => reg.unregister()));
caches.keys().then(n => n.forEach(name => caches.delete(name)));
console.log('✓ SW & caches cleared');
```

### 2. Run Tests

```bash
# All tests
npm run test:e2e

# Only Chromium (faster)
npm run test:e2e -- --project=chromium

# With browser UI (for debugging)
npm run test:e2e -- --headed

# Specific test file
npm run test:e2e -- tests/e2e/auth.spec.ts

# Specific test by name
npm run test:e2e -- --grep "login"
```

---

## Test Files

### `basic.spec.ts`
Basic smoke tests to verify application is working:
- ✅ Homepage loads
- ✅ Signin page loads
- ✅ Dashboard accessible after login
- ✅ Navigation works

### `auth.spec.ts`
Authentication tests:
- ✅ User registration
- ✅ User login
- ✅ User logout
- ✅ Invalid credentials error

### `fixtures.ts`
Shared fixtures:
- `auth` - Auto-login for tests
- `login` - Manual login helper
- `workflow` - Test workflow creation
- `billing` - Test billing data

---

## Configuration

### `playwright.config.ts`
- **Base URL:** `http://localhost:3002`
- **Timeout:** 60 seconds per test
- **Parallel:** Yes (fullyParallel: true)
- **Retries:** 0 (dev), 2 (CI)
- **Browsers:** Chromium, Firefox, WebKit, Mobile

### Environment Variables
```bash
# In .env.local
TEST_BASE_URL=http://localhost:3002  # Override default base URL
```

---

## Writing New Tests

### Template
```typescript
import { test, expect } from "./fixtures";

test.describe("Feature Name", () => {
  test("should do something", async ({ page }) => {
    await page.goto("/path");
    await expect(page).toHaveURL(/expected/);
  });

  test("should do something with login", async ({ page, auth: _auth }) => {
    // auth fixture auto-logins
    await page.goto("/dashboard");
    // Your test logic
  });
});
```

### Using Login Helper
```typescript
test("custom login test", async ({ page, login }) => {
  await login(); // Manual login
  await page.goto("/dashboard");
  // Your test logic
});
```

---

## Debugging Tests

### Run with UI Mode
```bash
npm run test:e2e -- --ui
```

### Run with Traces
```bash
npm run test:e2e -- --trace on
npx playwright show-trace
```

### Run in Debug Mode
```bash
npm run test:e2e -- --debug
```

### Screenshot on Failure
Automatic - check `test-results/` folder

### Video on Failure
Automatic - check `test-results/` folder for `.webm` files

---

## Common Issues

### 1. Test Timeout
**Problem:** Test times out waiting for element
**Solution:** Increase timeout or check if element exists
```typescript
await element.waitFor({ state: "visible", timeout: 10000 });
```

### 2. Service Worker Cache
**Problem:** Old cached pages interfere with tests
**Solution:** Unregister Service Workers before running tests

### 3. Database State
**Problem:** Tests fail due to database state
**Solution:** Use unique data for each test (e.g., `test.${Date.now()}@email.com`)

### 4. Authentication Issues
**Problem:** Login doesn't work in tests
**Solution:** Use `auth` fixture for auto-login or `login` helper

---

## Test Reports

### HTML Report
```bash
npm run test:e2e
npx playwright show-report
```

### JSON Report
Location: `test-results/results.json`

### Playwright Report Folder
Location: `playwright-report/`

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests
on: [push]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e -- --project=chromium
```

---

## Best Practices

1. **Use Fixtures:** Always use `auth` or `login` for authenticated tests
2. **Unique Data:** Use timestamps for unique test data
3. **Wait Conditions:** Use explicit waits, not timeouts
4. **Selectors:** Use role-based selectors (`getByRole`, `getByLabel`)
5. **Cleanup:** Clean up test data after tests (use global teardown)

---

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run test:e2e` | Run all E2E tests |
| `npm run test:e2e -- --headed` | Run with visible browser |
| `npm run test:e2e -- --project=chromium` | Run only on Chromium |
| `npm run test:e2e -- --grep "AUTH"` | Run tests matching "AUTH" |
| `npm run test:e2e -- --ui` | Run in UI mode |
| `npm run test:e2e -- --debug` | Run in debug mode |
| `npm run playwright:install` | Install Playwright browsers |

---

**Last Updated:** 2026-03-08  
**Status:** ✅ Ready for Testing
