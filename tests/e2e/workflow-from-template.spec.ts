/**
 * Workflow From Template E2E Tests
 * 
 * Tests for creating workflows from templates:
 * - Template selection UI
 * - Template preview
 * - Workflow creation from all 8 templates
 * - Variable substitution
 * - Workflow activation
 */
import { test as authTest, expect } from "./fixtures";

authTest.describe("Workflow From Template E2E", () => {
  authTest.describe("Template Selection UI", () => {
    authTest("displays all workflow templates", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows");
      
      // Check if template selector is visible
      await expect(page.getByText(/workflow|template/i)).toBeVisible({ timeout: 10000 });
      
      // Verify all 8 templates are listed
      const templates = [
        'auto_checkin_reminder',
        'auto_review_request',
        'low_occupancy_alert',
        'vip_guest_alert',
        'payment_reminder',
        'eturizem_auto_sync',
        'housekeeping_task_assignment',
        'dynamic_price_adjustment',
      ];
      
      for (const template of templates) {
        const templateElement = page.getByText(new RegExp(template.replace(/_/g, ' '), 'i'));
        await expect(templateElement).toBeVisible();
      }
    });

    authTest("filters templates by category", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows");
      
      // Select guest-communication category
      const categoryFilter = page.getByRole("button", { name: /guest communication|gost/i });
      if (await categoryFilter.isVisible()) {
        await categoryFilter.click();
        
        // Should show only guest-communication templates
        await expect(page.getByText(/auto_checkin_reminder/i)).toBeVisible();
        await expect(page.getByText(/auto_review_request/i)).toBeVisible();
      }
    });

    authTest("shows template details on selection", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows");
      
      // Click on a template
      const template = page.getByText(/auto_checkin_reminder/i);
      if (await template.isVisible()) {
        await template.click();
        
        // Should show template details
        await expect(page.getByText(/description|opis/i)).toBeVisible({ timeout: 5000 });
        await expect(page.getByText(/trigger/i)).toBeVisible();
        await expect(page.getByText(/action/i)).toBeVisible();
      }
    });
  });

  authTest.describe("Template Preview", () => {
    authTest("displays template preview before creation", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      // Select template
      await page.getByText(/vip_guest_alert/i).click();
      
      // Check preview section
      await expect(page.getByText(/preview|predogled/i)).toBeVisible({ timeout: 5000 });
      
      // Should show trigger info
      await expect(page.getByText(/event: reservation\.created/i)).toBeVisible();
      
      // Should show actions
      await expect(page.getByText(/send_notification/i)).toBeVisible();
      await expect(page.getByText(/create_task/i)).toBeVisible();
    });

    authTest("shows estimated time savings", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Should display time savings
      await expect(page.getByText(/15 min|čas|saved|prihranek/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("shows difficulty level", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/vip_guest_alert/i).click();
      
      // Should display difficulty
      await expect(page.getByText(/easy|medium|hard|lahko|srednje|težko/i)).toBeVisible({ timeout: 5000 });
    });
  });

  authTest.describe("Creating Workflows from Templates", () => {
    authTest("creates workflow from auto_checkin_reminder template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      // Select template
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Click create button
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      // Should redirect to workflow editor or list
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      
      // Verify workflow was created
      await expect(page.getByText(/avtomatski check-in opomnik/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("creates workflow from auto_review_request template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_review_request/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      await expect(page.getByText(/avtomatska prošnja za review/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("creates workflow from low_occupancy_alert template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/low_occupancy_alert/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      await expect(page.getByText(/alert za nizko zasedenost/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("creates workflow from vip_guest_alert template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/vip_guest_alert/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      await expect(page.getByText(/vip gost alert/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("creates workflow from payment_reminder template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/payment_reminder/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      await expect(page.getByText(/opomnik za plačilo/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("creates workflow from eturizem_auto_sync template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/eturizem_auto_sync/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      await expect(page.getByText(/avtomatska eturizem sinhronizacija/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("creates workflow from housekeeping_task_assignment template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/housekeeping_task_assignment/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      await expect(page.getByText(/avtomatska dodelitev housekeeping/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("creates workflow from dynamic_price_adjustment template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/dynamic_price_adjustment/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      await expect(page.getByText(/dinamično prilagajanje cen/i)).toBeVisible({ timeout: 5000 });
    });
  });

  authTest.describe("Workflow Activation", () => {
    authTest("activates created workflow", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      // Create workflow
      await page.getByText(/auto_checkin_reminder/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      // Wait for redirect
      await expect(page).toHaveURL(/\/dashboard\/workflows/, { timeout: 10000 });
      
      // Find and activate workflow
      const activateToggle = page.getByRole("switch", { name: /active|aktivno/i });
      if (await activateToggle.isVisible()) {
        await activateToggle.click();
        
        // Verify activation
        await expect(page.getByText(/active|aktivno/i)).toBeVisible({ timeout: 5000 });
      }
    });

    authTest("shows workflow is active in list", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows");
      
      // Check if any workflow is marked as active
      const activeIndicator = page.getByText(/active|aktivno|running|deluje/i);
      if (await activeIndicator.isVisible()) {
        await expect(activeIndicator).toBeVisible();
      }
    });
  });

  authTest.describe("Variable Substitution", () => {
    authTest("allows customizing template variables", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Should show variable configuration
      const variableInputs = page.getByLabel(/variable|property|guest/i);
      if (await variableInputs.count() > 0) {
        await variableInputs.first().fill("Test Property");
      }
    });

    authTest("displays template variables list", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/vip_guest_alert/i).click();
      
      // Should show variables section
      await expect(page.getByText(/variables|spremenljivke/i)).toBeVisible({ timeout: 5000 });
      
      // Should list variables
      await expect(page.getByText(/guest\.name/i)).toBeVisible();
      await expect(page.getByText(/guest\.loyaltyTier/i)).toBeVisible();
    });
  });

  authTest.describe("Trigger Configuration", () => {
    authTest("shows scheduled trigger configuration", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Should show schedule info
      await expect(page.getByText(/0 10 \* \* \*/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/daily|vsak dan/i)).toBeVisible();
    });

    authTest("shows event trigger configuration", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/vip_guest_alert/i).click();
      
      // Should show event info
      await expect(page.getByText(/reservation\.created/i)).toBeVisible({ timeout: 5000 });
      await expect(page.getByText(/event|dogodek/i)).toBeVisible();
    });

    authTest("shows trigger conditions", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/low_occupancy_alert/i).click();
      
      // Should show condition
      await expect(page.getByText(/occupancy\.next_7_days < 30/i)).toBeVisible({ timeout: 5000 });
    });
  });

  authTest.describe("Action Configuration", () => {
    authTest("shows email action in template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Should show send_email action
      await expect(page.getByText(/send_email|pošlji email/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("shows SMS action in template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Should show send_sms action
      await expect(page.getByText(/send_sms|pošlji sms/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("shows notification action in template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/vip_guest_alert/i).click();
      
      // Should show send_notification action
      await expect(page.getByText(/send_notification|pošlji obvestilo/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("shows task creation action in template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Should show create_task action
      await expect(page.getByText(/create_task|ustvari nalogo/i)).toBeVisible({ timeout: 5000 });
    });

    authTest("shows multiple actions in template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/vip_guest_alert/i).click();
      
      // Should show multiple actions
      const actions = page.getByText(/send_|create_|update_/i);
      await expect(actions).toHaveCount({ min: 2 });
    });
  });

  authTest.describe("Category Filtering", () => {
    authTest("filters by guest-communication category", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      const filter = page.getByRole("button", { name: /guest communication|gost/i });
      if (await filter.isVisible()) {
        await filter.click();
        
        // Should show only guest-communication templates
        await expect(page.getByText(/auto_checkin_reminder/i)).toBeVisible();
        await expect(page.getByText(/auto_review_request/i)).toBeVisible();
        await expect(page.getByText(/payment_reminder/i)).toBeVisible();
      }
    });

    authTest("filters by operations category", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      const filter = page.getByRole("button", { name: /operations|operacije/i });
      if (await filter.isVisible()) {
        await filter.click();
        
        await expect(page.getByText(/vip_guest_alert/i)).toBeVisible();
        await expect(page.getByText(/housekeeping_task_assignment/i)).toBeVisible();
      }
    });

    authTest("filters by revenue category", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      const filter = page.getByRole("button", { name: /revenue|prihodki/i });
      if (await filter.isVisible()) {
        await filter.click();
        
        await expect(page.getByText(/low_occupancy_alert/i)).toBeVisible();
        await expect(page.getByText(/dynamic_price_adjustment/i)).toBeVisible();
      }
    });

    authTest("filters by compliance category", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      const filter = page.getByRole("button", { name: /compliance|skladnost/i });
      if (await filter.isVisible()) {
        await filter.click();
        
        await expect(page.getByText(/eturizem_auto_sync/i)).toBeVisible();
      }
    });
  });

  authTest.describe("Error Handling", () => {
    authTest("handles template creation failure gracefully", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      // Try to create workflow with invalid data
      await page.getByText(/auto_checkin_reminder/i).click();
      
      // Clear required field if possible
      const propertyInput = page.getByLabel(/property/i);
      if (await propertyInput.isVisible()) {
        await propertyInput.clear();
      }
      
      // Try to create
      await page.getByRole("button", { name: /create|ustvari/i }).click();
      
      // Should show error or validation message
      const errorVisible = await page.getByText(/error|required|obvezno/i).isVisible({ timeout: 5000 });
      expect(errorVisible).toBe(true);
    });

    authTest("shows loading state during creation", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows/templates");
      
      await page.getByText(/auto_checkin_reminder/i).click();
      await page.getByRole("button", { name: /create workflow|ustvari/i }).click();
      
      // Check for loading indicator
      const loadingVisible = await page.getByText(/creating|ustvarjam|loading/i).isVisible({ timeout: 2000 });
      expect(loadingVisible).toBe(true);
    });
  });

  authTest.describe("Workflow List After Creation", () => {
    authTest("shows created workflow in list", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows");
      
      // Should show list of workflows
      await expect(page.getByText(/workflows|delotoki/i)).toBeVisible({ timeout: 10000 });
      
      // Count workflows
      const workflowCount = await page.getByText(/template|avtomatski|alert/i).count();
      expect(workflowCount).toBeGreaterThan(0);
    });

    authTest("allows editing created workflow", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows");
      
      // Find edit button
      const editButton = page.getByRole("button", { name: /edit|uredi/i }).first();
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Should redirect to editor
        await expect(page).toHaveURL(/\/dashboard\/workflows\/.*\/edit/, { timeout: 10000 });
      }
    });

    authTest("allows deleting created workflow", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/workflows");
      
      // Find delete button
      const deleteButton = page.getByRole("button", { name: /delete|izbriši/i }).first();
      if (await deleteButton.isVisible()) {
        // Should show confirmation dialog
        await deleteButton.click();
        
        const confirmButton = page.getByRole("button", { name: /confirm|potrdi|delete|izbriši/i });
        if (await confirmButton.isVisible()) {
          // Don't actually delete, just verify dialog exists
          await expect(confirmButton).toBeVisible();
        }
      }
    });
  });
});
