import { test, expect } from '@playwright/test';

test.describe('Simple Property Test', () => {
  test('Can login and access property pages', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.fill('#email', 'e2e@test.com');
    await page.fill('#password', 'e2e-secret');
    
    // Wait for button to be enabled
    await page.waitForSelector('button[type="submit"]:not(:disabled)', { timeout: 5000 });
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('http://localhost:3002/dashboard', { timeout: 10000 });
    
    // Navigate to properties
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Wait for properties to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check if page loaded
    const heading = await page.locator('h1').textContent();
    expect(heading).toContain('Properties');
    
    // Take screenshot
    await page.screenshot({ path: 'test-property-dashboard.png' });
  });

  test('Can access property details', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3002/login');
    await page.fill('#email', 'e2e@test.com');
    await page.fill('#password', 'e2e-secret');
    
    // Wait for button to be enabled
    await page.waitForSelector('button[type="submit"]:not(:disabled)', { timeout: 5000 });
    await page.click('button[type="submit"]');
    
    // Wait for dashboard
    await page.waitForURL('http://localhost:3002/dashboard', { timeout: 10000 });
    
    // Navigate to properties
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Wait for properties to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Click on first property if exists
    const propertyCards = page.locator('.bg-white.rounded-lg.shadow');
    if (await propertyCards.count() > 0) {
      await propertyCards.first().click();
      
      // Wait for property details
      await page.waitForSelector('h1', { timeout: 10000 });
      
      // Check for tabs
      const tabs = ['overview', 'rooms', 'pricing', 'amenities', 'policies', 'blocked-dates', 'integrations'];
      for (const tab of tabs) {
        const tabElement = page.locator(`text=${tab}`);
        if (await tabElement.isVisible()) {
          console.log(`Found tab: ${tab}`);
        }
      }
      
      // Take screenshot
      await page.screenshot({ path: 'test-property-details.png' });
    }
  });
});
