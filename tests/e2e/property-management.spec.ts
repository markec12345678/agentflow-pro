/**
 * E2E Test: Property Management
 * Tests property CRUD operations
 */

import { test, expect } from '@playwright/test';

test.describe('Property Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('test@agentflow.com');
    await page.locator('input[type="password"]').fill('test123');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);
  });

  test('should display properties page', async ({ page }) => {
    await page.goto('/dashboard/properties');

    // Check page elements
    await expect(page.locator('h1')).toContainText('Properties');
    await expect(page.locator('button:has-text("Add Property")')).toBeVisible();
  });

  test('should create new property', async ({ page }) => {
    await page.goto('/dashboard/properties/create');

    // Fill property form
    await page.locator('input[name="name"]').fill('Test Property');
    await page.locator('input[name="address"]').fill('Test Address 123');
    await page.locator('input[name="rooms"]').fill('5');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for success
    await expect(page.locator('text=Property created successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should validate property form', async ({ page }) => {
    await page.goto('/dashboard/properties/create');

    // Try to submit empty form
    await page.locator('button[type="submit"]').click();

    // Should show validation errors
    await expect(page.locator('input[name="name"]:invalid')).toBeVisible();
    await expect(page.locator('input[name="address"]:invalid')).toBeVisible();
  });

  test('should edit existing property', async ({ page }) => {
    await page.goto('/dashboard/properties');

    // Click edit on first property
    await page.locator('button:has-text("Edit")').first().click();

    // Modify name
    await page.locator('input[name="name"]').fill('Updated Property Name');

    // Save changes
    await page.locator('button[type="submit"]').click();

    // Wait for success
    await expect(page.locator('text=Property updated')).toBeVisible({ timeout: 5000 });
  });
});
