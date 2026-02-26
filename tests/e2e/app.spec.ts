/**
 * AgentFlow Pro - E2E Tests with Playwright
 * End-to-end testing for user workflows
 */

import { test, expect } from '@playwright/test';

// Test data
const testUser = {
  email: 'test@example.com',
  name: 'Test User',
  password: 'TestPassword123!'
};

const testProperty = {
  name: 'Grand Hotel Ljubljana',
  location: 'Ljubljana, Slovenia',
  type: 'Luxury Hotel',
  amenities: ['WiFi', 'Spa', 'Restaurant', 'Concierge'],
  rating: 4.5
};

test.describe('Authentication Flow', () => {
  test('should register new user successfully', async ({ page }) => {
    await page.goto('/auth/register');
    
    // Fill registration form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="name-input"]', testUser.name);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.fill('[data-testid="confirm-password-input"]', testUser.password);
    
    // Select plan
    await page.selectOption('[data-testid="plan-select"]', 'starter');
    
    // Submit registration
    await page.click('[data-testid="register-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-name"]')).toContainText(testUser.name);
  });

  test('should login existing user successfully', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill login form
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-email"]')).toContainText(testUser.email);
  });

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Fill invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@example.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    
    // Submit login
    await page.click('[data-testid="login-button"]');
    
    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
  });

  test('should handle password reset flow', async ({ page }) => {
    await page.goto('/auth/forgot-password');
    
    // Enter email
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.click('[data-testid="reset-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset link sent');
  });
});

test.describe('Tourism Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should generate property description successfully', async ({ page }) => {
    await page.goto('/tourism/workflows');
    
    // Select property description workflow
    await page.selectOption('[data-testid="workflow-select"]', 'property_description');
    
    // Fill property data
    await page.fill('[data-testid="property-name"]', testProperty.name);
    await page.fill('[data-testid="property-location"]', testProperty.location);
    await page.selectOption('[data-testid="property-type"]', testProperty.type);
    await page.fill('[data-testid="property-rating"]', testProperty.rating.toString());
    
    // Execute workflow
    await page.click('[data-testid="execute-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="workflow-results"]');
    
    // Should contain generated content
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-content"]')).toContainText(testProperty.name);
    await expect(page.locator('[data-testid="generated-content"]')).toContainText(testProperty.location);
  });

  test('should generate tour package content successfully', async ({ page }) => {
    await page.goto('/tourism/workflows');
    
    // Select tour package workflow
    await page.selectOption('[data-testid="workflow-select"]', 'tour_package');
    
    // Fill tour data
    await page.fill('[data-testid="tour-destination"]', 'Slovenia');
    await page.fill('[data-testid="tour-duration"]', '7');
    await page.fill('[data-testid="tour-activities"]', 'Hiking, Wine tasting, Castle tours');
    await page.selectOption('[data-testid="tour-accommodation"]', '4-star hotels');
    
    // Execute workflow
    await page.click('[data-testid="execute-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="workflow-results"]');
    
    // Should contain generated content
    await expect(page.locator('[data-testid="generated-content"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('Slovenia');
    await expect(page.locator('[data-testid="generated-content"]')).toContainText('7 days');
  });

  test('should translate content to multiple languages', async ({ page }) => {
    await page.goto('/tourism/multilang');
    
    // Enter content to translate
    await page.fill('[data-testid="content-input"]', 'Welcome to our beautiful hotel in Ljubljana');
    
    // Select source and target languages
    await page.selectOption('[data-testid="source-language"]', 'en');
    await page.check('[data-testid="target-language-sl"]');
    await page.check('[data-testid="target-language-de"]');
    await page.check('[data-testid="target-language-it"]');
    
    // Translate content
    await page.click('[data-testid="translate-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="translation-results"]');
    
    // Should contain translations
    await expect(page.locator('[data-testid="translation-sl"]')).toBeVisible();
    await expect(page.locator('[data-testid="translation-de"]')).toBeVisible();
    await expect(page.locator('[data-testid="translation-it"]')).toBeVisible();
    
    // Check Slovenian translation
    const slovenianTranslation = await page.locator('[data-testid="translation-sl"]').textContent();
    expect(slovenianTranslation).toContain('Dobrodošli');
  });

  test('should schedule seasonal content', async ({ page }) => {
    await page.goto('/tourism/seasonal');
    
    // Fill seasonal content
    await page.fill('[data-testid="content-title"]', 'Summer Vacation Special');
    await page.fill('[data-testid="content-body"]', 'Enjoy our amazing summer packages with special discounts');
    await page.selectOption('[data-testid="season-select"]', 'summer');
    await page.fill('[data-testid="scheduled-date"]', '2026-06-01');
    
    // Schedule content
    await page.click('[data-testid="schedule-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Content scheduled successfully');
    
    // Should appear in scheduled content list
    await expect(page.locator('[data-testid="scheduled-content-list"]')).toContainText('Summer Vacation Special');
  });
});

test.describe('Booking Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should search across booking channels', async ({ page }) => {
    await page.goto('/booking/search');
    
    // Fill search criteria
    await page.fill('[data-testid="location-input"]', 'Ljubljana');
    await page.fill('[data-testid="check-in"]', '2026-06-01');
    await page.fill('[data-testid="check-out"]', '2026-06-03');
    await page.fill('[data-testid="guests"]', '2');
    
    // Search
    await page.click('[data-testid="search-button"]');
    
    // Wait for results
    await page.waitForSelector('[data-testid="search-results"]');
    
    // Should show results from multiple channels
    await expect(page.locator('[data-testid="booking-com-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="airbnb-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="price-comparison"]')).toBeVisible();
  });

  test('should create unified booking', async ({ page }) => {
    await page.goto('/booking/create');
    
    // Select channel
    await page.selectOption('[data-testid="channel-select"]', 'booking.com');
    
    // Fill booking details
    await page.fill('[data-testid="property-id"]', 'hotel-ljubljana-123');
    await page.fill('[data-testid="check-in"]', '2026-06-01');
    await page.fill('[data-testid="check-out"]', '2026-06-03');
    await page.fill('[data-testid="guests"]', '2');
    
    // Fill guest details
    await page.fill('[data-testid="guest-name"]', 'John Doe');
    await page.fill('[data-testid="guest-email"]', 'john@example.com');
    await page.fill('[data-testid="guest-phone"]', '+386 123 456 789');
    
    // Create booking
    await page.click('[data-testid="create-booking-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking created successfully');
    
    // Should show booking details
    await expect(page.locator('[data-testid="booking-details"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-id"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmation-code"]')).toBeVisible();
  });

  test('should sync availability across channels', async ({ page }) => {
    await page.goto('/booking/sync');
    
    // Enter property ID
    await page.fill('[data-testid="property-id"]', 'hotel-ljubljana-123');
    
    // Sync availability
    await page.click('[data-testid="sync-button"]');
    
    // Should show sync results
    await expect(page.locator('[data-testid="sync-results"]')).toBeVisible();
    await expect(page.locator('[data-testid="booking-com-availability"]')).toBeVisible();
    await expect(page.locator('[data-testid="airbnb-availability"]')).toBeVisible();
    await expect(page.locator('[data-testid="conflicts"]')).toBeVisible();
  });
});

test.describe('Review Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should add guest review successfully', async ({ page }) => {
    await page.goto('/reviews/add');
    
    // Fill review details
    await page.selectOption('[data-testid="rating-select"]', '5');
    await page.selectOption('[data-testid="platform-select"]', 'booking.com');
    await page.fill('[data-testid="review-title"]', 'Amazing stay!');
    await page.fill('[data-testid="review-content"]', 'Perfect location, clean apartment, great host. Would definitely stay again!');
    await page.fill('[data-testid="guest-name"]', 'John Doe');
    
    // Add review
    await page.click('[data-testid="add-review-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Review added successfully');
    
    // Should appear in reviews list
    await expect(page.locator('[data-testid="reviews-list"]')).toContainText('Amazing stay!');
  });

  test('should generate automated response for positive review', async ({ page }) => {
    await page.goto('/reviews/manage');
    
    // Select positive review template
    await page.selectOption('[data-testid="template-select"]', 'positive_5_star');
    
    // Fill personalization
    await page.fill('[data-testid="guest-name"]', 'John Doe');
    await page.fill('[data-testid="property-name"]', 'Grand Hotel Ljubljana');
    await page.fill('[data-testid="specific-points"]', 'great location and clean rooms');
    
    // Generate response
    await page.click('[data-testid="generate-response-button"]');
    
    // Should show generated response
    await expect(page.locator('[data-testid="generated-response"]')).toBeVisible();
    await expect(page.locator('[data-testid="generated-response"]')).toContainText('Dear John Doe');
    await expect(page.locator('[data-testid="generated-response"]')).toContainText('Grand Hotel Ljubljana');
  });

  test('should show review analytics', async ({ page }) => {
    await page.goto('/reviews/analytics');
    
    // Should show analytics dashboard
    await expect(page.locator('[data-testid="total-reviews"]')).toBeVisible();
    await expect(page.locator('[data-testid="average-rating"]')).toBeVisible();
    await expect(page.locator="[data-testid="rating-distribution"]')).toBeVisible();
    await expect(page.locator('[data-testid="response-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-breakdown"]')).toBeVisible();
  });
});

test.describe('Billing Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('should display available plans', async ({ page }) => {
    await page.goto('/billing/plans');
    
    // Should show all plans
    await expect(page.locator('[data-testid="plan-starter"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-pro"]')).toBeVisible();
    await expect(page.locator('[data-testid="plan-enterprise"]')).toBeVisible();
    
    // Check plan details
    await expect(page.locator('[data-testid="plan-starter"]')).toContainText('$39');
    await expect(page.locator('[data-testid="plan-pro"]')).toContainText('$79');
    await expect(page.locator('[data-testid="plan-enterprise"]')).toContainText('$299');
  });

  test('should upgrade subscription successfully', async ({ page }) => {
    await page.goto('/billing/management');
    
    // Select upgrade plan
    await page.selectOption('[data-testid="plan-select"]', 'pro');
    
    // Upgrade subscription
    await page.click('[data-testid="upgrade-button"]');
    
    // Should show success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Subscription upgraded successfully');
    
    // Should show updated plan
    await expect(page.locator('[data-testid="current-plan"]')).toContainText('Pro');
  });

  test('should show usage statistics', async ({ page }) => {
    await page.goto('/billing/usage');
    
    // Should show usage stats
    await expect(page.locator('[data-testid="agent-runs-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-usage"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-members-usage"]')).toBeVisible();
    
    // Should show progress bars
    await expect(page.locator('[data-testid="agent-runs-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="storage-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="team-members-progress"]')).toBeVisible();
  });

  test('should track usage in real-time', async ({ page }) => {
    await page.goto('/billing/usage');
    
    // Track agent run
    await page.click('[data-testid="track-agent-run"]');
    
    // Should update usage
    await expect(page.locator('[data-testid="agent-runs-used"]')).not.toHaveText('0');
    
    // Track storage usage
    await page.fill('[data-testid="storage-input"]', '2500');
    await page.click('[data-testid="track-storage"]');
    
    // Should update storage usage
    await expect(page.locator('[data-testid="storage-used"]')).toContainText('2500MB');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile devices', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone 12
    await page.goto('/');
    
    // Should show mobile navigation
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Should be able to navigate
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    await page.click('[data-testid="mobile-menu-item-dashboard"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should work on tablet devices', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad
    await page.goto('/dashboard');
    
    // Should adapt layout
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await expect(page.locator('[data-testid="main-content"]')).toBeVisible();
  });

  test('should work on desktop devices', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 }); // Desktop
    await page.goto('/dashboard');
    
    // Should show full layout
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
    await page.locator('[data-testid="main-content"]');
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load dashboard quickly', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should handle large content generation efficiently', async ({ page }) => {
    await page.goto('/tourism/workflows');
    
    // Generate large content
    await page.selectOption('[data-testid="workflow-select"]', 'destination_blog');
    await page.fill('[data-testid="destination"]', 'Slovenia');
    await page.fill('[data-testid="word-count"]', '2000');
    
    const startTime = Date.now();
    await page.click('[data-testid="execute-button"]');
    await page.waitForSelector('[data-testid="workflow-results"]');
    const endTime = Date.now();
    
    const generationTime = endTime - startTime;
    
    // Should generate within 10 seconds
    expect(generationTime).toBeLessThan(10000);
  });
});
