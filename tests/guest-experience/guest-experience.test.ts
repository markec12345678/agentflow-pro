/**
 * Guest Experience Module - Comprehensive Tests
 * 
 * Tests for:
 * - Guest Experience Engine
 * - AI Recommendations
 * - Sentiment Analysis
 * - Loyalty Program
 * - Guest Profile Manager UI
 * - Guest Experience API
 * - use-guest-experience Hook
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// GUEST EXPERIENCE ENGINE TESTS
// ============================================================================

test.describe('Guest Experience Engine', () => {
  test('should initialize engine', async ({ page }) => {
    await page.goto('/dashboard');
    
    // Check if engine initializes
    const engineReady = await page.evaluate(async () => {
      try {
        const { GuestExperienceEngine } = await import('@/lib/guest-experience/GuestExperienceEngine');
        const engine = new GuestExperienceEngine();
        await engine.initialize();
        return true;
      } catch (error) {
        console.error('Engine initialization failed:', error);
        return false;
      }
    });
    
    expect(engineReady).toBe(true);
  });

  test('should generate AI recommendations', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Wait for recommendations to load
    await page.waitForSelector('[data-testid="recommendations"]', { timeout: 10000 });
    
    const recommendations = await page.locator('[data-testid="recommendation-card"]').count();
    expect(recommendations).toBeGreaterThan(0);
  });

  test('should analyze sentiment', async ({ page }) => {
    const sentimentResult = await page.evaluate(async () => {
      const { SentimentAnalyzer } = await import('@/lib/guest-experience/sentiment-analysis');
      const analyzer = new SentimentAnalyzer();
      await analyzer.initialize();
      
      const result = await analyzer.analyze('Amazing stay! Loved everything!');
      return {
        label: result.label,
        confidence: result.confidence,
        hasThemes: result.themes.length > 0
      };
    });
    
    expect(sentimentResult.label).toBe('positive');
    expect(sentimentResult.confidence).toBeGreaterThan(0.7);
    expect(sentimentResult.hasThemes).toBe(true);
  });

  test('should calculate loyalty points', async ({ page }) => {
    const pointsResult = await page.evaluate(async () => {
      const { LoyaltyProgramEngine } = await import('@/lib/guest-experience/loyalty-program');
      const loyalty = new LoyaltyProgramEngine();
      await loyalty.initialize();
      
      const points = await loyalty.calculatePoints(
        { totalPrice: 1000, numberOfNights: 5 },
        'gold'
      );
      
      return points;
    });
    
    // 1000 * 10 * 1.5 (gold multiplier) = 15000
    expect(pointsResult).toBe(15000);
  });

  test('should check tier upgrade', async ({ page }) => {
    const upgradeResult = await page.evaluate(async () => {
      const { LoyaltyProgramEngine } = await import('@/lib/guest-experience/loyalty-program');
      const loyalty = new LoyaltyProgramEngine();
      await loyalty.initialize();
      
      // Mock guest with 6000 lifetime points (should be gold)
      const tier = loyalty.getTier(6000);
      return tier;
    });
    
    expect(upgradeResult).toBe('gold');
  });
});

// ============================================================================
// GUEST PROFILE MANAGER UI TESTS
// ============================================================================

test.describe('Guest Profile Manager UI', () => {
  test('should load guest profile', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Wait for profile to load
    await page.waitForSelector('[data-testid="guest-name"]', { timeout: 10000 });
    
    const guestName = await page.locator('[data-testid="guest-name"]').textContent();
    expect(guestName).toBeTruthy();
  });

  test('should display loyalty tier', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    await page.waitForSelector('[data-testid="loyalty-tier"]', { timeout: 10000 });
    
    const tier = await page.locator('[data-testid="loyalty-tier"]').textContent();
    expect(['bronze', 'silver', 'gold', 'platinum', 'diamond']).toContain(tier?.toLowerCase());
  });

  test('should show recommendations tab', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Click recommendations tab
    await page.click('[data-testid="tab-recommendations"]');
    
    // Wait for recommendations to load
    await page.waitForSelector('[data-testid="recommendation-card"]', { timeout: 10000 });
    
    const cards = await page.locator('[data-testid="recommendation-card"]').count();
    expect(cards).toBeGreaterThan(0);
  });

  test('should update preferences', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Click preferences tab
    await page.click('[data-testid="tab-preferences"]');
    
    // Edit room type
    await page.click('[data-testid="edit-preferences"]');
    await page.selectOption('[data-testid="room-type-select"]', 'suite');
    await page.click('[data-testid="save-preferences"]');
    
    // Wait for success message
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    
    const successMessage = await page.locator('[data-testid="success-message"]').textContent();
    expect(successMessage).toContain('updated');
  });

  test('should display stay history', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Click history tab
    await page.click('[data-testid="tab-history"]');
    
    // Wait for stays to load
    await page.waitForSelector('[data-testid="stay-card"]', { timeout: 10000 });
    
    const stays = await page.locator('[data-testid="stay-card"]').count();
    expect(stays).toBeGreaterThan(0);
  });

  test('should submit feedback', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Click feedback tab
    await page.click('[data-testid="tab-feedback"]');
    
    // Fill feedback form
    await page.fill('[data-testid="feedback-comment"]', 'Excellent service!');
    await page.selectOption('[data-testid="feedback-rating"]', '9');
    await page.click('[data-testid="submit-feedback"]');
    
    // Wait for success
    await page.waitForSelector('[data-testid="feedback-success"]', { timeout: 10000 });
  });
});

// ============================================================================
// GUEST EXPERIENCE API TESTS
// ============================================================================

test.describe('Guest Experience API', () => {
  test('GET /api/guests/[id] should return profile', async ({ request }) => {
    const response = await request.get('/api/guests/test-guest-123');
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('id');
    expect(data.data).toHaveProperty('name');
    expect(data.data).toHaveProperty('loyalty');
  });

  test('PUT /api/guests/[id]/preferences should update preferences', async ({ request }) => {
    const response = await request.put('/api/guests/test-guest-123/preferences', {
      data: {
        preferences: {
          roomType: 'suite',
          communicationChannel: 'whatsapp'
        }
      }
    });
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('POST /api/guests/[id]/recommendations should generate recommendations', async ({ request }) => {
    const response = await request.post('/api/guests/test-guest-123/recommendations');
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('POST /api/guests/[id]/feedback should submit feedback', async ({ request }) => {
    const response = await request.post('/api/guests/test-guest-123/feedback', {
      data: {
        type: 'review',
        channel: 'website',
        overallRating: 9,
        comment: 'Great stay!'
      }
    });
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  test('GET /api/guests/[id]/loyalty should return loyalty info', async ({ request }) => {
    const response = await request.get('/api/guests/test-guest-123/loyalty');
    
    expect(response.ok()).toBe(true);
    
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('tier');
    expect(data.data).toHaveProperty('points');
  });
});

// ============================================================================
// USE-GUEST-EXPERIENCE HOOK TESTS
// ============================================================================

test.describe('use-guest-experience Hook', () => {
  test('should load guest profile', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Wait for hook to load data
    await page.waitForFunction(() => {
      const profile = document.querySelector('[data-testid="guest-profile"]');
      return profile !== null;
    }, { timeout: 10000 });
    
    const profileLoaded = await page.locator('[data-testid="guest-profile"]').isVisible();
    expect(profileLoaded).toBe(true);
  });

  test('should handle loading state', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    // Check if loading state appears initially
    const loadingVisible = await page.locator('[data-testid="loading-spinner"]').isVisible();
    expect(loadingVisible).toBe(true);
    
    // Wait for loading to complete
    await page.waitForSelector('[data-testid="guest-profile"]', { timeout: 10000 });
    
    const loadingGone = await page.locator('[data-testid="loading-spinner"]').isHidden();
    expect(loadingGone).toBe(true);
  });

  test('should handle error state', async ({ page }) => {
    await page.goto('/dashboard/guests/invalid-guest-id');
    
    // Wait for error state
    await page.waitForSelector('[data-testid="error-message"]', { timeout: 10000 });
    
    const errorVisible = await page.locator('[data-testid="error-message"]').isVisible();
    expect(errorVisible).toBe(true);
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

test.describe('Guest Experience Integration', () => {
  test('complete guest journey', async ({ page }) => {
    // 1. Load profile
    await page.goto('/dashboard/guests/test-guest-123');
    await page.waitForSelector('[data-testid="guest-name"]', { timeout: 10000 });
    
    // 2. Check loyalty status
    const tier = await page.locator('[data-testid="loyalty-tier"]').textContent();
    expect(tier).toBeTruthy();
    
    // 3. View recommendations
    await page.click('[data-testid="tab-recommendations"]');
    await page.waitForSelector('[data-testid="recommendation-card"]', { timeout: 10000 });
    
    // 4. Update preferences
    await page.click('[data-testid="tab-preferences"]');
    await page.click('[data-testid="edit-preferences"]');
    await page.selectOption('[data-testid="room-type-select"]', 'suite');
    await page.click('[data-testid="save-preferences"]');
    await page.waitForSelector('[data-testid="success-message"]', { timeout: 10000 });
    
    // 5. View stay history
    await page.click('[data-testid="tab-history"]');
    await page.waitForSelector('[data-testid="stay-card"]', { timeout: 10000 });
    
    // 6. Submit feedback
    await page.click('[data-testid="tab-feedback"]');
    await page.fill('[data-testid="feedback-comment"]', 'Amazing experience!');
    await page.selectOption('[data-testid="feedback-rating"]', '10');
    await page.click('[data-testid="submit-feedback"]');
    await page.waitForSelector('[data-testid="feedback-success"]', { timeout: 10000 });
  });
});

// ============================================================================
// PERFORMANCE TESTS
// ============================================================================

test.describe('Guest Experience Performance', () => {
  test('should load profile within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/dashboard/guests/test-guest-123');
    await page.waitForSelector('[data-testid="guest-profile"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000);
  });

  test('should generate recommendations within 5 seconds', async ({ page }) => {
    await page.goto('/dashboard/guests/test-guest-123');
    
    const startTime = Date.now();
    
    await page.click('[data-testid="tab-recommendations"]');
    await page.waitForSelector('[data-testid="recommendation-card"]', { timeout: 10000 });
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });
});
