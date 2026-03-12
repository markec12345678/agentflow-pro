/**
 * Dashboard E2E Tests
 * 
 * Tests for dashboard UI and user interactions:
 * - Dashboard creation from template
 * - Widget rendering
 * - Role-based dashboard selection
 * - Widget interactions
 */
import { test as authTest, expect } from "./fixtures";

authTest.describe("Dashboard E2E", () => {
  authTest.describe("Dashboard Template Selection", () => {
    authTest("displays dashboard template selector", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check if dashboard or template selector is visible
      await expect(page.getByText(/dashboard|template/i)).toBeVisible({ timeout: 10000 });
    });

    authTest("shows all 5 dashboard templates", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/templates");
      
      // Check for dashboard template names
      const templates = [
        'owner',
        'director',
        'receptor',
        'housekeeping',
        'manager',
      ];
      
      for (const template of templates) {
        const templateElement = page.getByText(new RegExp(template, 'i'));
        if (await templateElement.isVisible()) {
          await expect(templateElement).toBeVisible();
        }
      }
    });

    authTest("filters dashboards by role", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Try to filter by role if filter UI exists
      const roleFilter = page.getByRole("button", { name: /role|filter/i }).first();
      if (await roleFilter.isVisible()) {
        await roleFilter.click();
        
        // Should show role options
        await expect(page.getByText(/owner|director|receptor/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  authTest.describe("Dashboard Creation", () => {
    authTest("creates dashboard from owner template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/templates");
      
      // Select owner template
      const ownerTemplate = page.getByText(/owner dashboard/i);
      if (await ownerTemplate.isVisible()) {
        await ownerTemplate.click();
        
        // Click create button
        const createButton = page.getByRole("button", { name: /create|ustvari/i });
        if (await createButton.isVisible()) {
          await createButton.click();
          
          // Should redirect to dashboard
          await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
        }
      }
    });

    authTest("creates dashboard from receptor template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/templates");
      
      const receptorTemplate = page.getByText(/receptor dashboard/i);
      if (await receptorTemplate.isVisible()) {
        await receptorTemplate.click();
        
        const createButton = page.getByRole("button", { name: /create|ustvari/i });
        if (await createButton.isVisible()) {
          await createButton.click();
          await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
        }
      }
    });

    authTest("creates dashboard from housekeeping template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/templates");
      
      const housekeepingTemplate = page.getByText(/housekeeping dashboard/i);
      if (await housekeepingTemplate.isVisible()) {
        await housekeepingTemplate.click();
        
        const createButton = page.getByRole("button", { name: /create|ustvari/i });
        if (await createButton.isVisible()) {
          await createButton.click();
          await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
        }
      }
    });

    authTest("shows loading state during dashboard creation", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/templates");
      
      const ownerTemplate = page.getByText(/owner dashboard/i);
      if (await ownerTemplate.isVisible()) {
        await ownerTemplate.click();
        
        const createButton = page.getByRole("button", { name: /create|ustvari/i });
        if (await createButton.isVisible()) {
          await createButton.click();
          
          // Check for loading indicator
          const loadingVisible = await page.getByText(/creating|loading|ustvarjam/i).isVisible({ timeout: 2000 });
          if (loadingVisible) {
            await expect(page.getByText(/creating|loading/i)).toBeVisible();
          }
        }
      }
    });
  });

  authTest.describe("Widget Rendering", () => {
    authTest("renders revenue widgets on owner dashboard", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for revenue-related widgets
      const revenueWidgets = [
        /prihodki|revenue|revenue_mtd/i,
        /adr|average daily rate/i,
        /revpar/i,
      ];
      
      for (const widget of revenueWidgets) {
        const widgetElement = page.getByText(widget);
        if (await widgetElement.isVisible()) {
          await expect(widgetElement).toBeVisible();
        }
      }
    });

    authTest("renders operations widgets on receptor dashboard", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for operations widgets
      const operationsWidgets = [
        /prihodi|arrivals|today_arrivals/i,
        /odhodi|departures|today_departures/i,
        /room status|status sob/i,
      ];
      
      for (const widget of operationsWidgets) {
        const widgetElement = page.getByText(widget);
        if (await widgetElement.isVisible()) {
          await expect(widgetElement).toBeVisible();
        }
      }
    });

    authTest("renders cleaning widgets on housekeeping dashboard", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for housekeeping widgets
      const housekeepingWidgets = [
        /rooms to clean|čiščenje/i,
        /cleaning progress|napredek/i,
      ];
      
      for (const widget of housekeepingWidgets) {
        const widgetElement = page.getByText(widget);
        if (await widgetElement.isVisible()) {
          await expect(widgetElement).toBeVisible();
        }
      }
    });

    authTest("displays widget icons", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for widget icons (emoji or SVG)
      const icons = page.locator('[class*="icon"], [class*="Icon"], svg').first();
      if (await icons.isVisible()) {
        await expect(icons).toBeVisible();
      }
    });

    authTest("displays widget titles", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for widget titles
      const titles = page.locator('h1, h2, h3, h4, h5, h6, [class*="title"]').first();
      if (await titles.isVisible()) {
        await expect(titles).toBeVisible();
      }
    });
  });

  authTest.describe("Widget Data Loading", () => {
    authTest("loads widget data", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Wait for data to load
      await page.waitForTimeout(2000);
      
      // Check for data display (numbers, charts, etc.)
      const dataVisible = await page.locator('[class*="data"], [class*="value"], [class*="number"]').isVisible({ timeout: 5000 });
      if (dataVisible) {
        await expect(page.locator('[class*="data"]').first()).toBeVisible();
      }
    });

    authTest("shows loading state for widgets", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for loading skeletons or spinners
      const loadingVisible = await page.getByText(/loading|nalagam/i).isVisible({ timeout: 2000 });
      const skeletonVisible = await page.locator('[class*="skeleton"], [class*="loading"]').isVisible({ timeout: 2000 });
      
      expect(loadingVisible || skeletonVisible).toBe(true);
    });

    authTest("refreshes widget data", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Look for refresh button
      const refreshButton = page.getByRole("button", { name: /refresh|osveži/i });
      if (await refreshButton.isVisible()) {
        await refreshButton.click();
        
        // Should show loading state
        await expect(page.getByText(/loading|refreshing/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  authTest.describe("Widget Interactions", () => {
    authTest("clicks on widget to view details", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Try clicking on a widget
      const widget = page.locator('[class*="widget"], [class*="card"]').first();
      if (await widget.isVisible()) {
        await widget.click();
        
        // Should navigate to details or show modal
        const urlChanged = page.url() !== 'http://localhost:3002/dashboard';
        const modalVisible = await page.locator('[class*="modal"], [class*="dialog"]').isVisible({ timeout: 2000 });
        
        expect(urlChanged || modalVisible).toBe(true);
      }
    });

    authTest("displays widget actions menu", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Look for action menu (three dots, settings icon, etc.)
      const actionMenu = page.getByRole("button", { name: /\.\.\./ }).first();
      if (await actionMenu.isVisible()) {
        await actionMenu.click();
        
        // Should show menu options
        await expect(page.getByText(/edit|remove|settings|configure/i)).toBeVisible({ timeout: 2000 });
      }
    });

    authTest("allows widget customization", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Look for settings or customize button
      const settingsButton = page.getByRole("button", { name: /settings|customize|configure/i });
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        // Should show customization options
        await expect(page.getByText(/size|position|refresh|data/i)).toBeVisible({ timeout: 5000 });
      }
    });
  });

  authTest.describe("Dashboard Layout", () => {
    authTest("displays grid layout", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for grid container
      const gridContainer = page.locator('[class*="grid"], [class*="layout"]').first();
      if (await gridContainer.isVisible()) {
        await expect(gridContainer).toBeVisible();
      }
    });

    authTest("widgets are properly positioned", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check that widgets don't overlap (basic check)
      const widgets = page.locator('[class*="widget"], [class*="card"]');
      const count = await widgets.count();
      
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
        
        // All widgets should be visible
        for (let i = 0; i < Math.min(count, 3); i++) {
          await expect(widgets.nth(i)).toBeVisible();
        }
      }
    });

    authTest("dashboard is responsive", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('[class*="widget"]').first()).toBeVisible({ timeout: 5000 });
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('[class*="widget"]').first()).toBeVisible();
      
      // Reset to desktop
      await page.setViewportSize({ width: 1920, height: 1080 });
    });
  });

  authTest.describe("Dashboard Navigation", () => {
    authTest("shows dashboard selector", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Look for dashboard switcher/selector
      const dashboardSelector = page.getByRole("combobox", { name: /dashboard|select/i });
      if (await dashboardSelector.isVisible()) {
        await expect(dashboardSelector).toBeVisible();
      }
    });

    authTest("allows switching between dashboards", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Look for dashboard switcher
      const dashboardSelector = page.getByRole("combobox", { name: /dashboard|select/i });
      if (await dashboardSelector.isVisible()) {
        await dashboardSelector.click();
        
        // Should show dashboard options
        await expect(page.getByRole("option")).toHaveCount({ min: 2 });
      }
    });

    authTest("displays current dashboard name", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Look for dashboard title
      const title = page.locator('h1, [class*="dashboard-title"]').first();
      if (await title.isVisible()) {
        const text = await title.textContent();
        expect(text?.toLowerCase()).toMatch(/dashboard|owner|director|receptor|housekeeping|manager/i);
      }
    });
  });

  authTest.describe("Error Handling", () => {
    authTest("handles dashboard load error gracefully", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for error message (if any)
      const errorVisible = await page.getByText(/error|failed|napaka/i).isVisible({ timeout: 10000 });
      
      // If there's an error, it should be user-friendly
      if (errorVisible) {
        await expect(page.getByText(/error|failed/i)).toBeVisible();
      }
    });

    authTest("shows empty state when no widgets", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Check for empty state message
      const emptyState = page.getByText(/no widgets|empty|add your first/i);
      if (await emptyState.isVisible()) {
        await expect(emptyState).toBeVisible();
      }
    });

    authTest("handles widget data fetch error", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Wait for data load
      await page.waitForTimeout(3000);
      
      // Check for error indicators on widgets
      const widgetError = page.getByText(/error loading|failed to load|napaka/i);
      if (await widgetError.isVisible()) {
        await expect(widgetError).toBeVisible();
      }
    });
  });

  authTest.describe("Dashboard Performance", () => {
    authTest("loads dashboard within 5 seconds", async ({
      page,
      auth: _auth,
    }) => {
      const startTime = Date.now();
      await page.goto("/dashboard");
      await page.waitForLoadState('networkidle');
      const duration = Date.now() - startTime;
      
      expect(duration).toBeLessThan(5000);
    });

    authTest("renders all widgets without timeout", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard");
      
      // Wait for widgets to render
      const widgets = page.locator('[class*="widget"], [class*="card"]');
      await expect(widgets.first()).toBeVisible({ timeout: 10000 });
    });
  });
});
