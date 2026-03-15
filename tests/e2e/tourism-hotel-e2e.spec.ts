/**
 * AgentFlow Pro - Tourism/Hotel Management E2E Test
 * 
 * Test Scenario:
 * 1. Login to system
 * 2. Navigate to Tourism Dashboard
 * 3. Check Calendar
 * 4. Verify Properties
 * 5. Check Housekeeping Tasks
 * 6. Generate Test Report with Screenshots
 * 
 * Uses: Playwright MCP + Chrome DevTools
 */

import { test, expect, devices } from '@playwright/test';

// Test Configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3002',
  email: 'test@agentflow.com',
  password: 'test123',
  screenshotDir: 'F:\\d\\tests\\screenshots\\',
  timeout: 30000,
};

// Test Suite
test.describe('🏨 AgentFlow Pro Tourism - E2E Test Suite', () => {
  
  // Test 1: Login Flow
  test('✅ Login Flow - Should login successfully', async ({ page }) => {
    console.log('🔐 Starting Login Test...');
    
    // Navigate to login page
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}01-login-page.png` });
    
    // Fill credentials
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    
    // Take screenshot before submit
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}02-credentials-filled.png` });
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    
    // Verify redirect
    expect(page.url()).toContain('/dashboard');
    
    // Screenshot after login
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}03-dashboard-logged-in.png` });
    
    console.log('✅ Login Successful!');
  });

  // Test 2: Dashboard Navigation
  test('📊 Dashboard - Should load tourism dashboard', async ({ page }) => {
    console.log('📊 Testing Dashboard...');
    
    // Login first
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Check dashboard elements
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Koledar')).toBeVisible();
    await expect(page.locator('text=Gosti')).toBeVisible();
    await expect(page.locator('text=Housekeeping')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}04-tourism-dashboard.png` });
    
    console.log('✅ Dashboard Loaded!');
  });

  // Test 3: Calendar Access
  test('📅 Calendar - Should access tourism calendar', async ({ page }) => {
    console.log('📅 Testing Calendar...');
    
    // Login
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to calendar
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard/tourism/calendar`);
    
    // Verify calendar elements
    await expect(page.locator('text=Koledar')).toBeVisible();
    await expect(page.locator('text=Nova rezervacija')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}05-calendar-page.png` });
    
    console.log('✅ Calendar Accessed!');
  });

  // Test 4: Properties Management
  test('🏠 Properties - Should access properties page', async ({ page }) => {
    console.log('🏠 Testing Properties...');
    
    // Login
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to properties
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard/properties`);
    
    // Verify properties elements
    await expect(page.locator('text=Properties')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}06-properties-page.png` });
    
    console.log('✅ Properties Accessed!');
  });

  // Test 5: Housekeeping Tasks
  test('🧹 Housekeeping - Should access housekeeping page', async ({ page }) => {
    console.log('🧹 Testing Housekeeping...');
    
    // Login
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to housekeeping
    await page.goto(`${TEST_CONFIG.baseURL}/dashboard/housekeeping`);
    
    // Verify housekeeping elements
    await expect(page.locator('text=Housekeeping')).toBeVisible();
    
    // Screenshot
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}07-housekeeping-page.png` });
    
    console.log('✅ Housekeeping Accessed!');
  });

  // Test 6: Mobile Responsiveness
  test('📱 Mobile - Should be responsive on mobile', async ({ browser }) => {
    console.log('📱 Testing Mobile Responsiveness...');
    
    // Use iPhone viewport
    const context = await browser.newContext({
      ...devices['iPhone 13'],
    });
    const page = await context.newPage();
    
    // Login
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    await page.fill('input[type="email"]', TEST_CONFIG.email);
    await page.fill('input[type="password"]', TEST_CONFIG.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Mobile screenshot
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}08-mobile-dashboard.png` });
    
    // Verify mobile menu
    await expect(page.locator('[aria-label="Menu"]')).toBeVisible();
    
    console.log('✅ Mobile Responsive!');
    
    await context.close();
  });

  // Test 7: Performance Test
  test('⚡ Performance - Should load within 3 seconds', async ({ page }) => {
    console.log('⚡ Testing Performance...');
    
    // Measure load time
    const startTime = Date.now();
    
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    
    const loadTime = Date.now() - startTime;
    
    console.log(`⏱️ Load time: ${loadTime}ms`);
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Screenshot
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}09-performance-test.png` });
    
    console.log('✅ Performance OK!');
  });

  // Test 8: Error Handling
  test('❌ Error Handling - Should show error on invalid login', async ({ page }) => {
    console.log('❌ Testing Error Handling...');
    
    // Navigate to login
    await page.goto(`${TEST_CONFIG.baseURL}/login`);
    
    // Fill invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Click login
    await page.click('button[type="submit"]');
    
    // Wait for error message
    await page.waitForSelector('text=Invalid credentials', { timeout: 5000 });
    
    // Screenshot
    await page.screenshot({ path: `${TEST_CONFIG.screenshotDir}10-error-handling.png` });
    
    console.log('✅ Error Handling Works!');
  });
});

// Test Report Generation
test.afterAll(async () => {
  console.log('\n📊 ==========================================');
  console.log('📊 E2E TEST SUITE COMPLETED');
  console.log('📊 ==========================================\n');
  
  console.log('📸 Screenshots saved to:', TEST_CONFIG.screenshotDir);
  console.log('✅ Total Tests: 8');
  console.log('📊 Report will be sent to Slack #testing channel\n');
});
