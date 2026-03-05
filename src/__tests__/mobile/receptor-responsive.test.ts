/**
 * Mobile responsive tests for Receptor Dashboard
 * Tests mobile layout, touch interactions, and responsive behavior
 */

import { test, expect } from '@playwright/test';

test.describe('Receptor Mobile Responsive Tests', () => {
  const mobileViewport = { width: 375, height: 667 };
  const tabletViewport = { width: 768, height: 1024 };
  const desktopViewport = { width: 1920, height: 1080 };

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('http://localhost:3000');
    await page.fill('[data-testid="email-input"]', 'receptor@test.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await expect(page.locator('[data-testid="receptor-dashboard"]')).toBeVisible();
  });

  test('Mobile dashboard layout', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Verify mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).toBeVisible();
    await expect(page.locator('[data-testid="desktop-menu"]')).not.toBeVisible();
    
    // Test mobile menu toggle
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-item"]')).toHaveCount.greaterThan(0);
    
    // Close mobile menu
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
    
    // Verify mobile stats grid (should be stacked vertically)
    const statsGrid = page.locator('[data-testid="stats-grid"]');
    await expect(statsGrid).toBeVisible();
    
    const statCards = page.locator('[data-testid="stat-card"]');
    const firstCard = statCards.first();
    const firstCardBox = await firstCard.boundingBox();
    
    // Cards should be stacked (not side by side)
    expect(firstCardBox?.width).toBeLessThan(400); // Mobile width constraint
    
    // Verify mobile quick actions
    const quickActions = page.locator('[data-testid="quick-actions"]');
    await expect(quickActions).toBeVisible();
    
    // Quick actions should be stacked on mobile
    const actionItems = page.locator('[data-testid="quick-action-item"]');
    const firstAction = actionItems.first();
    const firstActionBox = await firstAction.boundingBox();
    
    expect(firstActionBox?.width).toBeLessThan(400);
  });

  test('Mobile room status grid', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Navigate to rooms status
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.click('[data-testid="rooms-status-link"]');
    await expect(page.locator('[data-testid="rooms-status-page"]')).toBeVisible();
    
    // Verify mobile room grid
    const roomGrid = page.locator('[data-testid="mobile-room-grid"]');
    await expect(roomGrid).toBeVisible();
    
    // Room cards should be full width on mobile
    const roomCards = page.locator('[data-testid="room-card"]');
    const firstRoomCard = roomCards.first();
    const firstRoomBox = await firstRoomCard.boundingBox();
    
    expect(firstRoomBox?.width).toBeLessThan(400);
    
    // Test room status indicators on mobile
    const statusIndicators = page.locator('[data-testid="room-status-indicator"]');
    await expect(statusIndicators.first()).toBeVisible();
    
    // Verify touch-friendly room actions
    const roomActions = page.locator('[data-testid="room-action-button"]');
    if (await roomActions.count() > 0) {
      const actionButton = roomActions.first();
      const actionBox = await actionButton.boundingBox();
      
      // Buttons should be touch-friendly (at least 44px)
      expect(actionBox?.height).toBeGreaterThanOrEqual(44);
      expect(actionBox?.width).toBeGreaterThanOrEqual(44);
    }
  });

  test('Mobile check-in flow', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Navigate to check-in
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.click('[data-testid="check-in-link"]');
    await expect(page.locator('[data-testid="check-in-page"]')).toBeVisible();
    
    // Verify mobile check-in list
    const checkInList = page.locator('[data-testid="mobile-check-in-list"]');
    await expect(checkInList).toBeVisible();
    
    // Test check-in item layout
    const checkInItems = page.locator('[data-testid="check-in-item"]');
    if (await checkInItems.count() > 0) {
      const firstItem = checkInItems.first();
      await firstItem.click();
      
      // Verify mobile check-in form
      const checkInForm = page.locator('[data-testid="mobile-check-in-form"]');
      await expect(checkInForm).toBeVisible();
      
      // Test form field sizing
      const formInputs = page.locator('input, select, textarea');
      for (let i = 0; i < await formInputs.count(); i++) {
        const input = formInputs.nth(i);
        const inputBox = await input.boundingBox();
        
        // Inputs should be touch-friendly
        expect(inputBox?.height).toBeGreaterThanOrEqual(44);
      }
      
      // Test mobile form submission
      await page.fill('[data-testid="actual-check-in-time"]', '14:00');
      await page.selectOption('[data-testid="room-condition"]', 'clean');
      await page.fill('[data-testid="check-in-notes"]', 'Mobile check-in test');
      
      // Submit button should be prominent
      const submitButton = page.locator('[data-testid="submit-check-in"]');
      await expect(submitButton).toBeVisible();
      
      const submitBox = await submitButton.boundingBox();
      expect(submitBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Mobile guest search', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Navigate to guest search
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.click('[data-testid="guest-search-link"]');
    await expect(page.locator('[data-testid="guest-search-page"]')).toBeVisible();
    
    // Verify mobile search interface
    const searchInput = page.locator('[data-testid="guest-search-input"]');
    await expect(searchInput).toBeVisible();
    
    // Test search input sizing
    const searchBox = await searchInput.boundingBox();
    expect(searchBox?.height).toBeGreaterThanOrEqual(44);
    
    // Perform search
    await page.fill('[data-testid="guest-search-input"]', 'John');
    await page.click('[data-testid="search-button"]');
    
    // Verify mobile search results
    const searchResults = page.locator('[data-testid="mobile-search-results"]');
    await expect(searchResults).toBeVisible();
    
    // Test guest result layout
    const guestResults = page.locator('[data-testid="guest-result"]');
    if (await guestResults.count() > 0) {
      const firstResult = guestResults.first();
      await firstResult.click();
      
      // Verify mobile guest detail modal
      const guestModal = page.locator('[data-testid="mobile-guest-modal"]');
      await expect(guestModal).toBeVisible();
      
      // Modal should be full screen on mobile
      const modalBox = await guestModal.boundingBox();
      expect(modalBox?.width).toBeLessThanOrEqual(400);
      
      // Test modal close button
      const closeButton = page.locator('[data-testid="close-modal"]');
      await expect(closeButton).toBeVisible();
      
      const closeBox = await closeButton.boundingBox();
      expect(closeBox?.height).toBeGreaterThanOrEqual(44);
    }
  });

  test('Mobile quick reservation', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Navigate to quick reservation
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.click('[data-testid="quick-reservation-link"]');
    await expect(page.locator('[data-testid="quick-reservation-page"]')).toBeVisible();
    
    // Verify mobile form layout
    const reservationForm = page.locator('[data-testid="mobile-reservation-form"]');
    await expect(reservationForm).toBeVisible();
    
    // Test form field layout
    const formFields = page.locator('[data-testid="form-field"]');
    for (let i = 0; i < await formFields.count(); i++) {
      const field = formFields.nth(i);
      const fieldBox = await field.boundingBox();
      
      // Fields should be full width on mobile
      expect(fieldBox?.width).toBeLessThanOrEqual(400);
    }
    
    // Test mobile date picker
    const dateInputs = page.locator('input[type="date"]');
    if (await dateInputs.count() > 0) {
      const dateInput = dateInputs.first();
      await expect(dateInput).toBeVisible();
      
      // Date inputs should be touch-friendly
      const dateBox = await dateInput.boundingBox();
      expect(dateBox?.height).toBeGreaterThanOrEqual(44);
    }
    
    // Test mobile room selection
    const roomSelect = page.locator('[data-testid="room-select"]');
    if (await roomSelect.count() > 0) {
      await expect(roomSelect).toBeVisible();
      await roomSelect.selectOption('1');
    }
    
    // Test mobile price display
    const priceDisplay = page.locator('[data-testid="mobile-price-display"]');
    await expect(priceDisplay).toBeVisible();
    
    // Test submit button
    const submitButton = page.locator('[data-testid="submit-reservation"]');
    await expect(submitButton).toBeVisible();
    
    const submitBox = await submitButton.boundingBox();
    expect(submitBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('Mobile reports interface', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Navigate to reports
    await page.click('[data-testid="mobile-menu-toggle"]');
    await page.click('[data-testid="reports-link"]');
    await expect(page.locator('[data-testid="reports-page"]')).toBeVisible();
    
    // Test mobile report navigation
    const reportLinks = page.locator('[data-testid="report-link"]');
    if (await reportLinks.count() > 0) {
      await reportLinks.first().click();
      
      // Verify mobile report view
      const reportView = page.locator('[data-testid="mobile-report-view"]');
      await expect(reportView).toBeVisible();
      
      // Test mobile date range selector
      const dateRange = page.locator('[data-testid="date-range"]');
      if (await dateRange.count() > 0) {
        await expect(dateRange).toBeVisible();
        
        const rangeBox = await dateRange.boundingBox();
        expect(rangeBox?.height).toBeGreaterThanOrEqual(44);
      }
      
      // Test mobile export buttons
      const exportButtons = page.locator('[data-testid="export-button"]');
      for (let i = 0; i < await exportButtons.count(); i++) {
        const button = exportButtons.nth(i);
        const buttonBox = await button.boundingBox();
        
        // Export buttons should be touch-friendly
        expect(buttonBox?.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('Tablet responsive behavior', async ({ page }) => {
    await page.setViewportSize(tabletViewport);
    
    // Verify tablet layout shows more content
    await expect(page.locator('[data-testid="tablet-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).not.toBeVisible();
    
    // Stats grid should show 2 columns on tablet
    const statsGrid = page.locator('[data-testid="stats-grid"]');
    const statCards = page.locator('[data-testid="stat-card"]');
    
    if (await statCards.count() >= 2) {
      const firstCard = statCards.first();
      const secondCard = statCards.nth(1);
      
      const firstBox = await firstCard.boundingBox();
      const secondBox = await secondCard.boundingBox();
      
      // Cards should be side by side on tablet
      if (firstBox && secondBox) {
        expect(secondBox.x).toBeGreaterThan(firstBox.x + firstBox.width);
      }
    }
    
    // Test tablet room grid
    await page.click('[data-testid="rooms-status-link"]');
    const roomGrid = page.locator('[data-testid="tablet-room-grid"]');
    await expect(roomGrid).toBeVisible();
    
    // Room cards should show in grid layout on tablet
    const roomCards = page.locator('[data-testid="room-card"]');
    if (await roomCards.count() >= 2) {
      const firstRoom = roomCards.first();
      const secondRoom = roomCards.nth(1);
      
      const firstRoomBox = await firstRoom.boundingBox();
      const secondRoomBox = await secondRoom.boundingBox();
      
      if (firstRoomBox && secondRoomBox) {
        expect(secondRoomBox.x).toBeGreaterThan(firstRoomBox.x + firstRoomBox.width);
      }
    }
  });

  test('Desktop responsive behavior', async ({ page }) => {
    await page.setViewportSize(desktopViewport);
    
    // Verify desktop layout
    await expect(page.locator('[data-testid="desktop-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu-toggle"]')).not.toBeVisible();
    
    // Stats grid should show 4 columns on desktop
    const statsGrid = page.locator('[data-testid="stats-grid"]');
    const statCards = page.locator('[data-testid="stat-card"]');
    
    if (await statCards.count() >= 4) {
      const cards = [];
      for (let i = 0; i < 4; i++) {
        const card = statCards.nth(i);
        const box = await card.boundingBox();
        if (box) cards.push(box);
      }
      
      // Cards should be in a horizontal row
      for (let i = 1; i < cards.length; i++) {
        expect(cards[i].x).toBeGreaterThan(cards[i-1].x + cards[i-1].width);
      }
    }
    
    // Test desktop room grid
    await page.click('[data-testid="rooms-status-link"]');
    const roomGrid = page.locator('[data-testid="desktop-room-grid"]');
    await expect(roomGrid).toBeVisible();
    
    // Room cards should show in multi-column grid
    const roomCards = page.locator('[data-testid="room-card"]');
    if (await roomCards.count() >= 3) {
      const rooms = [];
      for (let i = 0; i < 3; i++) {
        const room = roomCards.nth(i);
        const box = await room.boundingBox();
        if (box) rooms.push(box);
      }
      
      // Should show multiple columns
      expect(rooms[1].x).toBeGreaterThan(rooms[0].x + rooms[0].width);
    }
  });

  test('Touch interactions and gestures', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Test swipe gestures on mobile
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test tap to close menu
    await page.tap('[data-testid="mobile-menu-overlay"]');
    await expect(page.locator("[data-testid='mobile-menu']")).not.toBeVisible();
    
    // Test scroll behavior on mobile
    await page.click('[data-testid="rooms-status-link"]');
    const roomGrid = page.locator('[data-testid="mobile-room-grid"]');
    
    // Add many rooms to test scrolling
    const roomCount = await page.locator('[data-testid="room-card"]').count();
    if (roomCount > 5) {
      // Test vertical scrolling
      await page.mouse.wheel(0, 500);
      await page.waitForTimeout(500);
      
      // Verify scroll position changed
      const scrollY = await page.evaluate(() => window.scrollY);
      expect(scrollY).toBeGreaterThan(0);
    }
    
    // Test horizontal scrolling if needed
    const quickActions = page.locator('[data-testid="quick-actions"]');
    if (await quickActions.count() > 0) {
      const actionsBox = await quickActions.boundingBox();
      if (actionsBox && actionsBox.width > 350) {
        // Test horizontal scroll
        await page.mouse.wheel(200, 0);
        await page.waitForTimeout(500);
      }
    }
  });

  test('Mobile performance and loading', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Test loading states on mobile
    await page.route('/api/receptor/daily-overview*', async route => {
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
    
    // Should show mobile loading state
    await expect(page.locator('[data-testid="mobile-loading-spinner"]')).toBeVisible();
    
    // Wait for content to load
    await expect(page.locator('[data-testid="receptor-dashboard"]')).toBeVisible();
    
    // Loading should be hidden
    await expect(page.locator('[data-testid="mobile-loading-spinner"]')).not.toBeVisible();
    
    // Test mobile navigation performance
    const navStart = Date.now();
    await page.click('[data-testid="mobile-menu-toggle"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    const navEnd = Date.now();
    
    // Mobile navigation should be fast
    expect(navEnd - navStart).toBeLessThan(500);
  });

  test('Mobile accessibility', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Test keyboard navigation on mobile
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();
    
    // Test ARIA labels on mobile elements
    const interactiveElements = page.locator('button, input, select, textarea, a');
    for (let i = 0; i < Math.min(5, await interactiveElements.count()); i++) {
      const element = interactiveElements.nth(i);
      const hasAriaLabel = await element.getAttribute('aria-label');
      const hasPlaceholder = await element.getAttribute('placeholder');
      const hasTitle = await element.getAttribute('title');
      
      // Mobile elements should have accessible labels
      expect(hasAriaLabel || hasPlaceholder || hasTitle).toBeTruthy();
    }
    
    // Test mobile screen reader compatibility
    const statCards = page.locator('[data-testid="stat-card"]');
    if (await statCards.count() > 0) {
      const firstCard = statCards.first();
      await expect(firstCard).toHaveAttribute('role');
      await expect(firstCard).toHaveAttribute('aria-label');
    }
    
    // Test mobile form accessibility
    await page.click('[data-testid="quick-reservation-link"]');
    const formInputs = page.locator('input, select, textarea');
    for (let i = 0; i < Math.min(3, await formInputs.count()); i++) {
      const input = formInputs.nth(i);
      await expect(input).toHaveAttribute('aria-label') || await expect(input).toHaveAttribute('placeholder');
    }
  });

  test('Mobile error handling', async ({ page }) => {
    await page.setViewportSize(mobileViewport);
    
    // Test network error on mobile
    await page.route('/api/receptor/daily-overview*', route => route.abort('failed'));
    await page.goto('/dashboard/receptor');
    
    // Should show mobile error message
    await expect(page.locator('[data-testid="mobile-error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-error-message"]')).toContainText('Failed to fetch data');
    
    // Test retry button on mobile
    const retryButton = page.locator('[data-testid="retry-button"]');
    if (await retryButton.count() > 0) {
      await expect(retryButton).toBeVisible();
      
      const retryBox = await retryButton.boundingBox();
      expect(retryBox?.height).toBeGreaterThanOrEqual(44);
    }
    
    // Test empty state on mobile
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
    
    // Should show mobile empty state
    await expect(page.locator('[data-testid="mobile-empty-state"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-empty-state"]')).toContainText('No data available');
  });
});
