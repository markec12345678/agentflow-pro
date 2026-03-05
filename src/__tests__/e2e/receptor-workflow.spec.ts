/**
 * E2E tests for Receptor Workflow using Playwright
 * Tests complete receptor workflow: Login → Dashboard → Check-in → Check-out → Reports
 */

import { test, expect } from '@playwright/test';

test.describe('Receptor Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
  });

  test('Complete receptor workflow', async ({ page }) => {
    // Step 1: Login as receptor
    await page.fill('[data-testid="email-input"]', 'receptor@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await expect(page.locator('[data-testid="receptor-dashboard"]')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Receptor Dashboard');

    // Step 2: Verify dashboard statistics
    await expect(page.locator('[data-testid="arrivals-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="departures-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="inhouse-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="available-stat"]')).toBeVisible();

    // Step 3: Navigate to rooms status
    await page.click('[data-testid="rooms-status-link"]');
    await expect(page.locator('[data-testid="rooms-status-page"]')).toBeVisible();
    
    // Verify room status grid
    await expect(page.locator('[data-testid="room-grid"]')).toBeVisible();
    const roomCards = page.locator('[data-testid="room-card"]');
    const roomCount = await roomCards.count();
    expect(roomCount).toBeGreaterThan(0);
    
    // Verify color-coded status indicators
    const availableRooms = page.locator('[data-testid="room-card"][data-status="available"]');
    const occupiedRooms = page.locator('[data-testid="room-card"][data-status="occupied"]');
    expect(await availableRooms.count() + await occupiedRooms.count()).toBeGreaterThan(0);

    // Step 4: Navigate to check-in page
    await page.click('[data-testid="check-in-link"]');
    await expect(page.locator('[data-testid="check-in-page"]')).toBeVisible();
    
    // Verify today's check-ins list
    await expect(page.locator('[data-testid="check-ins-list"]')).toBeVisible();
    
    // If there are check-ins, test the check-in flow
    const checkInItems = page.locator('[data-testid="check-in-item"]');
    if (await checkInItems.count() > 0) {
      await checkInItems.first().click();
      await expect(page.locator('[data-testid="check-in-form"]')).toBeVisible();
      
      // Fill check-in form
      await page.fill('[data-testid="actual-check-in-time"]', '14:00');
      await page.selectOption('[data-testid="room-condition"]', 'clean');
      await page.fill('[data-testid="check-in-notes"]', 'Guest arrived on time, room in good condition');
      
      // Submit check-in
      await page.click('[data-testid="submit-check-in"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Check-in completed successfully');
    }

    // Step 5: Navigate to check-out page
    await page.click('[data-testid="check-out-link"]');
    await expect(page.locator('[data-testid="check-out-page"]')).toBeVisible();
    
    // Verify today's check-outs list
    await expect(page.locator('[data-testid="check-outs-list"]')).toBeVisible();
    
    // If there are check-outs, test the check-out flow
    const checkOutItems = page.locator('[data-testid="check-out-item"]');
    if (await checkOutItems.count() > 0) {
      await checkOutItems.first().click();
      await expect(page.locator('[data-testid="check-out-form"]')).toBeVisible();
      
      // Fill check-out form
      await page.fill('[data-testid="actual-check-out-time"]', '11:00');
      await page.selectOption('[data-testid="room-condition"]', 'clean');
      await page.fill('[data-testid="check-out-notes"]', 'Room left in good condition, no damages');
      
      // Add guest feedback
      await page.selectOption('[data-testid="guest-satisfaction"]', '5');
      await page.fill('[data-testid="guest-feedback"]', 'Great stay, would recommend');
      
      // Submit check-out
      await page.click('[data-testid="submit-check-out"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Check-out completed successfully');
    }

    // Step 6: Navigate to guest search
    await page.click('[data-testid="guest-search-link"]');
    await expect(page.locator('[data-testid="guest-search-page"]')).toBeVisible();
    
    // Test guest search functionality
    await page.fill('[data-testid="guest-search-input"]', 'John');
    await page.click('[data-testid="search-button"]');
    
    // Verify search results
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
    
    // If results found, test guest detail view
    const searchResults = page.locator('[data-testid="guest-result"]');
    if (await searchResults.count() > 0) {
      await searchResults.first().click();
      await expect(page.locator('[data-testid="guest-detail-modal"]')).toBeVisible();
      
      // Verify guest information
      await expect(page.locator('[data-testid="guest-name"]')).toBeVisible();
      await expect(page.locator('[data-testid="guest-email"]')).toBeVisible();
      await expect(page.locator('[data-testid="guest-phone"]')).toBeVisible();
      
      // Close modal
      await page.click('[data-testid="close-modal"]');
    }

    // Step 7: Navigate to quick reservation
    await page.click('[data-testid="quick-reservation-link"]');
    await expect(page.locator('[data-testid="quick-reservation-page"]')).toBeVisible();
    
    // Test quick reservation form
    await page.fill('[data-testid="guest-name"]', 'Test Guest');
    await page.fill('[data-testid="guest-email"]', 'test@example.com');
    await page.fill('[data-testid="guest-phone"]', '+1234567890');
    
    // Select room
    await page.selectOption('[data-testid="room-select"]', '1');
    
    // Select dates
    await page.fill('[data-testid="check-in-date"]', '2024-01-15');
    await page.fill('[data-testid="check-out-date"]', '2024-01-17');
    
    // Verify price calculation
    await expect(page.locator('[data-testid="calculated-price"]')).toBeVisible();
    
    // Submit reservation
    await page.click('[data-testid="submit-reservation"]');
    
    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Reservation created successfully');

    // Step 8: Navigate to reports
    await page.click('[data-testid="reports-link"]');
    await expect(page.locator('[data-testid="reports-page"]')).toBeVisible();
    
    // Test occupancy report
    await page.click('[data-testid="occupancy-report-link"]');
    await expect(page.locator('[data-testid="occupancy-report-page"]')).toBeVisible();
    
    // Verify report components
    await expect(page.locator('[data-testid="report-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="report-chart"]')).toBeVisible();
    
    // Test date range selection
    await page.selectOption('[data-testid="date-range"]', 'week');
    await expect(page.locator('[data-testid="report-chart"]')).toBeVisible();
    
    // Test export functionality
    await page.click('[data-testid="export-csv"]');
    // Note: In real test, you'd verify download, but for E2E we'll just verify the button works
    
    // Step 9: Return to dashboard and verify updated stats
    await page.click('[data-testid="dashboard-link"]');
    await expect(page.locator('[data-testid="receptor-dashboard"]')).toBeVisible();
    
    // Verify dashboard is still responsive
    await expect(page.locator('[data-testid="arrivals-stat"]')).toBeVisible();
    await expect(page.locator('[data-testid="departures-stat"]')).toBeVisible();

    // Step 10: Logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');
    await expect(page.locator('[data-testid="login-page"]')).toBeVisible();
  });

  test('Mobile responsive design', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.fill('[data-testid="email-input"]', 'receptor@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Verify mobile dashboard
    await expect(page.locator('[data-testid="receptor-dashboard"]')).toBeVisible();
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Verify mobile stats grid (should be stacked)
    const statsGrid = page.locator('[data-testid="stats-grid"]');
    await expect(statsGrid).toBeVisible();
    
    // Verify mobile room status grid
    await page.click('[data-testid="rooms-status-link"]');
    await expect(page.locator('[data-testid="mobile-room-grid"]')).toBeVisible();
    
    // Verify mobile forms
    await page.click('[data-testid="check-in-link"]');
    await expect(page.locator('[data-testid="mobile-check-in-form"]')).toBeVisible();
    
    // Test mobile form submission
    const checkInItems = page.locator('[data-testid="check-in-item"]');
    if (await checkInItems.count() > 0) {
      await checkInItems.first().click();
      await expect(page.locator('[data-testid="mobile-check-in-form"]')).toBeVisible();
      
      // Verify form is scrollable on mobile
      const formHeight = await page.locator('[data-testid="mobile-check-in-form"]').evaluate(el => el.scrollHeight);
      const viewportHeight = page.viewportSize()?.height || 800;
      expect(formHeight).toBeLessThanOrEqual(viewportHeight);
    }
  });

  test('Role-based access control', async ({ page }) => {
    // Test with different roles
    const roles = [
      { email: 'receptor@test.com', password: 'password123', allowedPages: ['/dashboard/receptor'] },
      { email: 'housekeeping@test.com', password: 'password123', allowedPages: ['/dashboard/rooms/housekeeping'] },
      { email: 'director@test.com', password: 'password123', allowedPages: ['/dashboard'] },
    ];

    for (const role of roles) {
      // Login with role
      await page.goto('http://localhost:3000');
      await page.fill('[data-testid="email-input"]', role.email);
      await page.fill('[data-testid="password-input"]', role.password);
      await page.click('[data-testid="login-button"]');
      
      // Test access to allowed pages
      for (const allowedPage of role.allowedPages) {
        await page.goto(`http://localhost:3000${allowedPage}`);
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).not.toContain('Access denied');
        expect(bodyText).not.toContain('403');
      }
      
      // Test access to restricted pages
      const restrictedPages = ['/dashboard/admin', '/dashboard/settings'];
      for (const restrictedPage of restrictedPages) {
        await page.goto(`http://localhost:3000${restrictedPage}`);
        // Should be redirected or denied access
        const currentUrl = page.url();
        const bodyText = await page.locator('body').textContent() || '';
        const isRedirected = currentUrl.includes('dashboard');
        const isDenied = bodyText.includes('Access denied');
        expect(isRedirected || isDenied).toBeTruthy();
      }
      
      // Logout
      await page.click('[data-testid="user-menu"]');
      await page.click('[data-testid="logout-button"]');
    }
  });

  test('Error handling and edge cases', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'receptor@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Test network error handling
    await page.route('/api/receptor/daily-overview*', route => route.abort('failed'));
    await page.goto('/dashboard/receptor');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Failed to fetch data');
    
    // Test empty states
    await page.unroute('/api/receptor/daily-overview*');
    await page.route('/api/receptor/daily-overview*', route => {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            date: '2024-01-01',
            stats: { arrivals: 0, departures: 0, inHouse: 0, available: 0, occupancyRate: 0, revenue: 0, pendingReservations: 0 },
            arrivals: [],
            departures: [],
            inHouse: [],
            pendingReservations: [],
          },
        }),
      });
    });
    
    await page.reload();
    
    // Should show empty state
    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="empty-state"]')).toContainText('No data available');
    
    // Test form validation
    await page.click('[data-testid="quick-reservation-link"]');
    await page.click('[data-testid="submit-reservation"]');
    
    // Should show validation errors
    await expect(page.locator('[data-testid="validation-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Guest name is required');
  });

  test('Performance and loading states', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'receptor@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Test loading states
    await page.route('/api/receptor/daily-overview*', async route => {
      // Simulate slow response
      await new Promise(resolve => setTimeout(resolve, 1000));
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            date: '2024-01-01',
            stats: { arrivals: 5, departures: 3, inHouse: 10, available: 5, occupancyRate: 66.7, revenue: 1500, pendingReservations: 2 },
            arrivals: [],
            departures: [],
            inHouse: [],
            pendingReservations: [],
          },
        }),
      });
    });
    
    await page.goto('/dashboard/receptor');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
    
    // Wait for data to load
    await expect(page.locator('[data-testid="receptor-dashboard"]')).toBeVisible();
    
    // Should hide loading state
    await expect(page.locator('[data-testid="loading-spinner"]')).not.toBeVisible();
    
    // Test performance metrics (basic check)
    const navigationStart = Date.now();
    await page.click('[data-testid="rooms-status-link"]');
    await expect(page.locator('[data-testid="rooms-status-page"]')).toBeVisible();
    const navigationEnd = Date.now();
    
    // Navigation should be reasonably fast (less than 3 seconds)
    expect(navigationEnd - navigationStart).toBeLessThan(3000);
  });

  test('Accessibility compliance', async ({ page }) => {
    // Login
    await page.fill('[data-testid="email-input"]', 'receptor@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test ARIA labels
    const statsCards = page.locator('[data-testid="stats-card"]');
    for (let i = 0; i < await statsCards.count(); i++) {
      const card = statsCards.nth(i);
      await expect(card).toHaveAttribute('aria-label');
    }
    
    // Test form accessibility
    await page.click('[data-testid="quick-reservation-link"]');
    const formInputs = page.locator('input, select, textarea');
    for (let i = 0; i < await formInputs.count(); i++) {
      const input = formInputs.nth(i);
      const hasAriaLabel = await input.getAttribute('aria-label');
      const hasPlaceholder = await input.getAttribute('placeholder');
      expect(hasAriaLabel || hasPlaceholder).toBeTruthy();
    }
    
    // Test color contrast (basic check)
    const statValues = page.locator('[data-testid="stat-value"]');
    for (let i = 0; i < await statValues.count(); i++) {
      const stat = statValues.nth(i);
      const computedStyle = await stat.evaluate(el => getComputedStyle(el));
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;
      
      // Basic contrast check (would need proper contrast calculation in real test)
      expect(color).not.toBe(backgroundColor);
    }
  });
});
