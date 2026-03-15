/**
 * E2E Test: API Endpoints
 * Tests critical API endpoints directly
 */

import { test, expect } from '@playwright/test';

test.describe('API Endpoints', () => {
  test('health check should return 200', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);

    const data = await response.json();
    expect(data.status).toBe('ok');
  });

  test('should reject invalid API requests', async ({ request }) => {
    // Try to access protected endpoint without auth
    const response = await request.get('/api/properties');
    expect([401, 403]).toContain(response.status());
  });

  test('should validate request body', async ({ request }) => {
    // Send invalid data to create endpoint
    const response = await request.post('/api/properties', {
      data: {}, // Empty body
    });
    expect([400, 401]).toContain(response.status());
  });
});
