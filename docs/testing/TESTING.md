# 🧪 AgentFlow Pro - Testing Guide

## Table of Contents

1. [Overview](#overview)
2. [Test Types](#test-types)
3. [Running Tests](#running-tests)
4. [Writing Tests](#writing-tests)
5. [Best Practices](#best-practices)
6. [Coverage](#coverage)

---

## Overview

AgentFlow Pro uses a comprehensive testing strategy:

- **Unit Tests**: Jest for component and utility testing
- **Integration Tests**: Jest for API and database testing
- **E2E Tests**: Playwright for full workflow testing
- **Visual Tests**: Playwright for screenshot comparison

---

## Test Types

### 1. Unit Tests

**Location:** `src/**/*.test.ts`

**Example:**
```typescript
// src/components/ui/button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../button';

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click Me');
  });

  it('handles clicks', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Tests

**Location:** `tests/integration/`

**Example:**
```typescript
// tests/integration/api-routes.test.ts
import { createTestClient } from '@/testing';

describe('Properties API', () => {
  it('should list properties', async () => {
    const client = createTestClient();
    const response = await client.get('/api/properties');
    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

### 3. E2E Tests

**Location:** `tests/e2e/`

**Example:**
```typescript
// tests/e2e/login-flow.spec.ts
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@agentflow.com');
  await page.fill('input[type="password"]', 'test123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/dashboard/);
  await expect(page.locator('text=Dashboard')).toBeVisible();
});
```

---

## Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### With Coverage
```bash
npm run test:coverage
```

### E2E Tests
```bash
# Headless
npm run test:e2e

# With UI
npm run test:e2e:ui

# In browser (headed)
npm run test:e2e:headed
```

### Specific Test File
```bash
npm test -- button.test.tsx
npm run test:e2e -- login-flow.spec.ts
```

---

## Writing Tests

### Unit Test Template

```typescript
/**
 * @jest-environment jsdom
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { Component } from '../component';

describe('Component', () => {
  it('should render correctly', () => {
    render(<Component />);
    expect(screen.getByTestId('component')).toBeInTheDocument();
  });

  it('should handle props', () => {
    render(<Component prop="value" />);
    expect(screen.getByText('value')).toBeInTheDocument();
  });

  it('should handle events', () => {
    const handler = jest.fn();
    render(<Component onClick={handler} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Setup - login, navigate, etc.
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
  });

  test('should work correctly', async ({ page }) => {
    await page.goto('/feature');
    await expect(page.locator('h1')).toContainText('Feature');
  });
});
```

---

## Best Practices

### 1. Test Naming

```typescript
// ✅ Good
it('should create property with valid data', () => {});
it('should show error with invalid email', () => {});

// ❌ Bad
it('test 1', () => {});
it('works', () => {});
```

### 2. Arrange-Act-Assert Pattern

```typescript
it('should update state on click', () => {
  // Arrange
  render(<Component />);
  const button = screen.getByRole('button');

  // Act
  fireEvent.click(button);

  // Assert
  expect(screen.getByText('Updated')).toBeInTheDocument();
});
```

### 3. Test Isolation

```typescript
// ✅ Good - Each test is independent
test('test 1', async () => {
  await page.goto('/page1');
  // ...
});

test('test 2', async () => {
  await page.goto('/page2');
  // ...
});

// ❌ Bad - Tests depend on each other
test('test 1', async () => {
  // Navigates to page
});

test('test 2', async () => {
  // Assumes already on page from test 1
});
```

### 4. Use Test IDs

```typescript
// Component
<div data-testid="user-card">
  <h1 data-testid="user-name">{user.name}</h1>
</div>

// Test
expect(screen.getByTestId('user-card')).toBeInTheDocument();
expect(screen.getByTestId('user-name')).toHaveTextContent('John');
```

---

## Coverage

### Current Coverage Goals

| Type | Target | Current |
|------|--------|---------|
| **Branches** | 70% | 65% |
| **Functions** | 70% | 65% |
| **Lines** | 70% | 65% |
| **Statements** | 70% | 65% |

### Generate Coverage Report

```bash
npm run test:coverage
```

### View HTML Report

```bash
open coverage/index.html
```

### Coverage Configuration

```json
// jest.config.js
{
  "coverageThreshold": {
    "global": {
      "branches": 70,
      "functions": 70,
      "lines": 70,
      "statements": 70
    }
  }
}
```

---

## Test Files Structure

```
tests/
├── __mocks__/           # Mock implementations
│   ├── config-env.ts
│   └── prisma-client.ts
├── e2e/                 # E2E tests
│   ├── login-flow.spec.ts
│   ├── property-management.spec.ts
│   ├── reservation-flow.spec.ts
│   ├── dashboard-navigation.spec.ts
│   └── api-endpoints.spec.ts
├── integration/         # Integration tests
│   ├── api-routes.test.ts
│   ├── domain-events.test.ts
│   └── use-cases.test.ts
├── unit/               # Unit tests
│   └── repositories.test.ts
├── fixtures/           # Test data
│   └── workflow-with-condition.json
└── jest.setup.ts       # Jest setup
```

---

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Push to main/develop branches
- Scheduled (weekly full test suite)

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run test:e2e
```

---

## Debugging Tests

### VS Code Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Current File",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["${relativeFile}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Playwright Inspector

```bash
PWDEBUG=1 npm run test:e2e
```

---

## Troubleshooting

### Test Fails Randomly

**Problem:** Flaky tests  
**Solution:** Add proper waits

```typescript
// ❌ Bad
await page.click('button');

// ✅ Good
await page.waitForSelector('button');
await page.click('button');
```

### Database Connection Error

**Problem:** Tests can't connect to database  
**Solution:** Use test database

```env
# .env.test
DATABASE_URL="postgresql://test:test@localhost:5432/agentflow_test"
```

### Timeout Errors

**Problem:** Test timeout  
**Solution:** Increase timeout

```typescript
test('long running test', async () => {
  // ...
}, 30000); // 30 second timeout
```

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro)
- [Playwright Test Examples](https://github.com/microsoft/playwright-test-examples)

---

**Last Updated:** 2026-03-15  
**Version:** 1.0.0
