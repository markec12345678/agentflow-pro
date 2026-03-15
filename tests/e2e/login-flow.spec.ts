/**
 * E2E Test: Login Flow
 * Tests the complete authentication flow
 */

import { test, expect } from '@playwright/test';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('should display login page correctly', async ({ page }) => {
    // Check page title
    await expect(page).toHaveTitle(/AgentFlow Pro/);

    // Check login form elements
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    // Fill credentials
    await page.locator('input[type="email"]').fill('test@agentflow.com');
    await page.locator('input[type="password"]').fill('test123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for navigation
    await page.waitForURL(/\/dashboard/);

    // Verify successful login
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Fill invalid credentials
    await page.locator('input[type="email"]').fill('invalid@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 5000 });
  });

  test('should validate email format', async ({ page }) => {
    // Fill invalid email
    await page.locator('input[type="email"]').fill('not-an-email');
    await page.locator('input[type="password"]').fill('test123');

    // Try to submit
    await page.locator('button[type="submit"]').click();

    // Should show validation error
    await expect(page.locator('input[type="email"]:invalid')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link
    await page.locator('text=Register').click();

    // Should navigate to register page
    await page.waitForURL(/\/register/);
    await expect(page.locator('h1')).toContainText('Create account');
  });
});
