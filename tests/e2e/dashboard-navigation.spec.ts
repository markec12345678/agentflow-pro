/**
 * E2E Test: Dashboard Navigation
 * Tests all main dashboard routes are accessible
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@agentflow.com');
    await page.locator('input[type="password"]').fill('test123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);
  });

  test('should access main dashboard', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Occupancy Rate')).toBeVisible();
  });

  test('should access calendar', async ({ page }) => {
    await page.goto('/dashboard/tourism/calendar');
    await expect(page.locator('text=Koledar')).toBeVisible();
  });

  test('should access guests page', async ({ page }) => {
    await page.goto('/dashboard/guests');
    await expect(page.locator('text=Guests')).toBeVisible();
  });

  test('should access housekeeping', async ({ page }) => {
    await page.goto('/dashboard/housekeeping');
    await expect(page.locator('text=Housekeeping')).toBeVisible();
  });

  test('should access reports', async ({ page }) => {
    await page.goto('/dashboard/reports');
    await expect(page.locator('text=Reports')).toBeVisible();
  });

  test('should access settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await expect(page.locator('text=Settings')).toBeVisible();
  });
});
