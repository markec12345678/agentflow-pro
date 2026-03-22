import { test, expect } from '@playwright/test';

test.describe('Property Management UI', () => {
  test.beforeEach(async ({ page }) => {
    // Login as e2e test user
    await page.goto('http://localhost:3002/login');
    await page.fill('[type="email"]', 'e2e@test.com');
    await page.fill('[type="password"]', 'e2e-secret');
    await page.click('button[type="submit"]');
    await page.waitForURL('http://localhost:3002/dashboard');
  });

  test('Property Dashboard loads and shows properties', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Wait for page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Properties');
    
    // Check if property cards exist
    const propertyCards = page.locator('.bg-white.rounded-lg.shadow');
    await expect(propertyCards.first()).toBeVisible({ timeout: 15000 });
    
    // Check for "Add Property" button
    await expect(page.locator('text=Add Property')).toBeVisible();
  });

  test('Property Details page loads with all tabs', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Wait for properties to load
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    
    // Click on first property
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Wait for property details to load
    await page.waitForSelector('h1', { timeout: 10000 });
    
    // Check main heading
    await expect(page.locator('h1')).toContainText('Property Details');
    
    // Check for all tabs
    const tabs = ['overview', 'rooms', 'pricing', 'amenities', 'policies', 'blocked-dates', 'integrations'];
    for (const tab of tabs) {
      await expect(page.locator(`text=${tab}`)).toBeVisible();
    }
  });

  test('Rooms Management - Add Room flow', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Wait for property details
    await page.waitForSelector('text=rooms', { timeout: 10000 });
    await page.click('text=rooms');
    
    // Wait for rooms page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Rooms');
    
    // Check for "Add Room" button
    await expect(page.locator('text=Add Room')).toBeVisible();
    
    // Click "Add Room" button
    await page.click('text=Add Room');
    
    // Check if modal appears
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
    await expect(page.locator('text=Add New Room')).toBeVisible();
    
    // Fill in room details
    await page.fill('[placeholder="Room 101, Suite A, etc."]', 'Test Room 101');
    await page.selectOption('select', 'double');
    await page.fill('[placeholder="Number of guests"]', '2');
    await page.fill('[placeholder="Number of beds"]', '1');
    await page.fill('[placeholder="Optional override"]', '100');
    
    // Select amenities
    await page.click('text=WiFi');
    await page.click('text=TV');
    await page.click('text=Balcony');
    
    // Add description
    await page.fill('[placeholder="Room description and features..."]', 'Test room with WiFi, TV and balcony');
    
    // Save room
    await page.click('text=Add Room');
    
    // Wait for modal to close
    await page.waitForSelector('.fixed.inset-0', { state: 'hidden', timeout: 5000 });
    
    // Check for success toast
    await expect(page.locator('text=Room added successfully')).toBeVisible({ timeout: 5000 });
  });

  test('Pricing Management - Configure pricing', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Click on pricing tab
    await page.waitForSelector('text=pricing', { timeout: 10000 });
    await page.click('text=pricing');
    
    // Wait for pricing page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Pricing');
    
    // Check for pricing overview cards
    await expect(page.locator('text=Base Price')).toBeVisible();
    await expect(page.locator('text=Season Rates')).toBeVisible();
    await expect(page.locator('text=Pricing Rules')).toBeVisible();
    
    // Click "Edit Pricing" button
    await expect(page.locator('text=Edit Pricing')).toBeVisible();
    await page.click('text=Edit Pricing');
    
    // Fill in base price
    await page.fill('[placeholder="0.00"]', '150');
    
    // Add seasonal rate
    await page.click('text=Add Rate');
    await page.fill('[type="date"]').first().fill('2024-06-01');
    await page.fill('[type="date"]').nth(1).fill('2024-08-31');
    await page.fill('[placeholder="Rate"]').first().fill('200');
    
    // Configure pricing rules
    await page.fill('[placeholder="1.2"]', '1.3');
    await page.fill('[placeholder="1"]', '2');
    await page.fill('[placeholder="Days"]').first().fill('14');
    await page.fill('[placeholder="Discount"]').first().fill('0.15');
    
    // Save pricing
    await page.click('text=Save Changes');
    
    // Check for success message
    await expect(page.locator('text=Pricing updated successfully')).toBeVisible({ timeout: 5000 });
  });

  test('Amenities Management - Add amenities', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Click on amenities tab
    await page.waitForSelector('text=amenities', { timeout: 10000 });
    await page.click('text=amenities');
    
    // Wait for amenities page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Amenities');
    
    // Check for categories
    await expect(page.locator('text=Connectivity')).toBeVisible();
    await expect(page.locator('text=Parking')).toBeVisible();
    await expect(page.locator('text=Facilities')).toBeVisible();
    
    // Add WiFi amenity
    await page.click('text=WiFi');
    
    // Add custom amenity
    await page.fill('[placeholder="Enter custom amenity..."]', 'Custom Test Amenity');
    await page.selectOption('select', 'other');
    await page.click('text=Add Amenity');
    
    // Check for success message
    await expect(page.locator('text=Amenity added successfully')).toBeVisible({ timeout: 5000 });
  });

  test('Policies Management - Add policies', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Click on policies tab
    await page.waitForSelector('text=policies', { timeout: 10000 });
    await page.click('text=policies');
    
    // Wait for policies page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Property Policies');
    
    // Check for policy types
    await expect(page.locator('text=Check-in/Check-out')).toBeVisible();
    await expect(page.locator('text=Cancellation')).toBeVisible();
    await expect(page.locator('text=Pets')).toBeVisible();
    
    // Add check-in policy
    await page.click('text=Check-in/Check-out');
    await page.click('text=Use Template');
    await expect(page.locator('text=Check-in time: 15:00')).toBeVisible();
    await page.click('text=Add Policy');
    
    // Check for success message
    await expect(page.locator('text=Policy added successfully')).toBeVisible({ timeout: 5000 });
  });

  test('Blocked Dates Management - Block dates', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Click on blocked dates tab
    await page.waitForSelector('text=blocked-dates', { timeout: 10000 });
    await page.click('text=blocked-dates');
    
    // Wait for blocked dates page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Blocked Dates');
    
    // Check for quick actions
    await expect(page.locator('text=Maintenance')).toBeVisible();
    await expect(page.locator('text=Owner Use')).toBeVisible();
    await expect(page.locator('text=Property Closed')).toBeVisible();
    
    // Click quick action for maintenance
    await page.click('text=Maintenance');
    
    // Check if modal appears
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
    await expect(page.locator('text=Block Dates')).toBeVisible();
    
    // Fill in dates
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await page.fill('[type="date"]').first().fill(today);
    await page.fill('[type="date"]').nth(1).fill(tomorrow);
    
    // Block dates
    await page.click('text=Block Dates');
    
    // Check for success message
    await expect(page.locator('text=Dates blocked successfully')).toBeVisible({ timeout: 5000 });
  });

  test('Integrations Management - Check status', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Click on integrations tab
    await page.waitForSelector('text=integrations', { timeout: 10000 });
    await page.click('text=integrations');
    
    // Wait for integrations page to load
    await page.waitForSelector('h1', { timeout: 10000 });
    await expect(page.locator('h1')).toContainText('Integrations');
    
    // Check for integration cards
    await expect(page.locator('text=eTurizem')).toBeVisible();
    await expect(page.locator('text=AJPES')).toBeVisible();
    await expect(page.locator('text=Stripe Payments')).toBeVisible();
    await expect(page.locator('text=Channel Manager')).toBeVisible();
    
    // Check for API Keys section
    await expect(page.locator('text=API Keys & Security')).toBeVisible();
    await expect(page.locator('text=eTurizem API Key')).toBeVisible();
    await expect(page.locator('text=Stripe API Keys')).toBeVisible();
    
    // Check for sync logs
    await expect(page.locator('text=Sync Logs')).toBeVisible();
  });

  test('Navigation and Responsive Design', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Test navigation between tabs
    const tabs = ['overview', 'rooms', 'pricing', 'amenities', 'policies', 'blocked-dates', 'integrations'];
    
    for (const tab of tabs) {
      await page.click(`text=${tab}`);
      await page.waitForTimeout(1000); // Wait for content to load
      
      // Check if URL contains the tab name
      await expect(page.url()).toContain(tab);
      
      // Check if main heading is visible
      await expect(page.locator('h1')).toBeVisible();
    }
    
    // Test back navigation
    await page.click('text=← Back to Property');
    await expect(page.url()).toContain('/dashboard/properties');
  });

  test('Error Handling and Validation', async ({ page }) => {
    await page.goto('http://localhost:3002/dashboard/properties');
    
    // Navigate to first property
    await page.waitForSelector('.bg-white.rounded-lg.shadow', { timeout: 15000 });
    await page.locator('.bg-white.rounded-lg.shadow').first().click();
    
    // Go to rooms page
    await page.waitForSelector('text=rooms', { timeout: 10000 });
    await page.click('text=rooms');
    
    // Try to add room without name
    await page.click('text=Add Room');
    await expect(page.locator('.fixed.inset-0')).toBeVisible();
    
    // Try to save without required fields
    await page.click('text=Add Room');
    
    // Check for validation error
    await expect(page.locator('text=Room name is required')).toBeVisible({ timeout: 3000 });
    
    // Close modal
    await page.keyboard.press('Escape');
    await expect(page.locator('.fixed.inset-0')).toBeHidden({ timeout: 3000 });
  });
});
