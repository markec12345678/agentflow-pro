/**
 * E2E Test: Reservation Flow
 * Tests complete booking workflow
 */

import { test, expect } from '@playwright/test';

test.describe('Reservation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@agentflow.com');
    await page.locator('input[type="password"]').fill('test123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);
  });

  test('should create new reservation', async ({ page }) => {
    await page.goto('/dashboard/reservations/new');

    // Fill reservation details
    await page.locator('select[name="propertyId"]').selectOption('1');
    await page.locator('input[name="guestName"]').fill('John Doe');
    await page.locator('input[name="guestEmail"]').fill('john@example.com');
    await page.locator('input[name="checkIn"]').fill('2026-04-01');
    await page.locator('input[name="checkOut"]').fill('2026-04-05');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Wait for success
    await expect(page.locator('text=Reservation created')).toBeVisible({ timeout: 5000 });
  });

  test('should validate reservation dates', async ({ page }) => {
    await page.goto('/dashboard/reservations/new');

    // Fill with checkOut before checkIn
    await page.locator('input[name="checkIn"]').fill('2026-04-05');
    await page.locator('input[name="checkOut"]').fill('2026-04-01');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should show error
    await expect(page.locator('text=Check-out must be after check-in')).toBeVisible({ timeout: 5000 });
  });

  test('should view reservation details', async ({ page }) => {
    await page.goto('/dashboard/reservations');

    // Click on first reservation
    await page.locator('table tr').first().click();

    // Should show details
    await expect(page.locator('text=Reservation Details')).toBeVisible();
  });
});
