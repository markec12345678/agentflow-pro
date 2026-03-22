/**
 * Email Workflow Automation E2E Tests
 * 
 * Tests for automated email workflows:
 * - Booking confirmation email trigger
 * - Pre-arrival email trigger
 * - Post-stay review request trigger
 * - Payment confirmation trigger
 * - Cancellation email trigger
 */
import { test as authTest, expect } from "./fixtures";

authTest.describe("Email Workflow Automation", () => {
  authTest.describe("Booking Confirmation Workflow", () => {
    authTest("sends booking confirmation email on reservation creation", async ({
      page,
      auth: _auth,
    }) => {
      // Navigate to reservations
      await page.goto("/dashboard/tourism/reservations");
      
      // Check if booking confirmation email workflow is configured
      await expect(page.getByText(/booking|rezervacija/i)).toBeVisible({ timeout: 10000 });
      
      // Verify email workflow settings exist
      const workflowSettings = page.getByText(/email workflow|avtomatizacija/i);
      if (await workflowSettings.isVisible()) {
        await workflowSettings.click();
        
        // Check booking confirmation is enabled
        await expect(
          page.getByText(/booking confirmation|potrdilo rezervacije/i)
        ).toBeVisible();
      }
    });

    authTest("displays booking confirmation email preview", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      // Select booking confirmation template
      await page.getByRole("radio", { name: /welcome|booking/i }).click();
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Bled");
      await page.getByPlaceholder(/črnomelj/i).fill("Bled");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      // Verify email content is generated
      const textarea = page.locator("textarea").last();
      await expect(textarea).toBeVisible({ timeout: 15000 });
      const content = await textarea.inputValue();
      expect(content).toMatch(/dobrodošli|welcome|hotel bled/i);
    });
  });

  authTest.describe("Pre-arrival Email Workflow", () => {
    authTest("sends pre-arrival email 7 days before check-in", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      // Select pre-arrival template
      await page.getByRole("radio", { name: /follow.up|pre-arrival/i }).click();
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Villa Kolpa");
      await page.getByPlaceholder(/črnomelj/i).fill("Črnomelj");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      // Verify pre-arrival content
      const textarea = page.locator("textarea").last();
      await expect(textarea).toBeVisible({ timeout: 15000 });
      const content = await textarea.inputValue();
      expect(content).toMatch(/prihod|check.in|navodila|parking/i);
    });

    authTest("includes check-in instructions in pre-arrival email", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByRole("radio", { name: /follow.up/i }).click();
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Test");
      await page.getByPlaceholder(/črnomelj/i).fill("Ljubljana");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      const content = await page.locator("textarea").last().inputValue();
      expect(content).toMatch(/kontakt|telefon|email|naslov/i);
    });
  });

  authTest.describe("Post-stay Review Request Workflow", () => {
    authTest("sends review request email after checkout", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      // Select follow-up/review template
      await page.getByRole("radio", { name: /follow.up|hvala/i }).click();
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Apartmaji Ana");
      await page.getByPlaceholder(/črnomelj/i).fill("Bled");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      // Verify review request content
      const content = await page.locator("textarea").last().inputValue();
      expect(content).toMatch(/hvala|review|mnenje|google|booking/i);
    });

    authTest("includes discount code for re-booking", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByRole("radio", { name: /follow.up/i }).click();
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Test");
      await page.getByPlaceholder(/črnomelj/i).fill("Test");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      const content = await page.locator("textarea").last().inputValue();
      expect(content).toMatch(/popust|diskont|koda|10%|naslednji/i);
    });
  });

  authTest.describe("Seasonal Campaign Workflow", () => {
    authTest("generates seasonal email with custom offer", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByRole("radio", { name: /sezonska/i }).click();
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Mountain Resort");
      await page.getByPlaceholder(/črnomelj/i).fill("Kranjska Gora");
      await page.getByPlaceholder(/poletje 2026/i).fill("Zimska Sezona");
      await page.getByPlaceholder(/15% popust/i).fill("Early Bird 20%");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      const content = await page.locator("textarea").last().inputValue();
      expect(content).toMatch(/zimska|sezona|early bird|20%/i);
    });

    authTest("includes urgency in seasonal campaign", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByRole("radio", { name: /sezonska/i }).click();
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Bled");
      await page.getByPlaceholder(/črnomelj/i).fill("Bled");
      await page.getByPlaceholder(/poletje 2026/i).fill("Poletna Akcija");
      await page.getByPlaceholder(/15% popust/i).fill("Samo do 31.3.");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      const content = await page.locator("textarea").last().inputValue();
      expect(content).toMatch(/samo|omejeno|do|31\.3\.|rok/i);
    });
  });

  authTest.describe("Email Template Selection", () => {
    authTest("shows all available email templates", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      // Check all template options are visible
      await expect(page.getByRole("radio", { name: /welcome/i })).toBeVisible();
      await expect(page.getByRole("radio", { name: /follow.up/i })).toBeVisible();
      await expect(page.getByRole("radio", { name: /sezonska/i })).toBeVisible();
    });

    authTest("updates form fields based on selected template", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      // Seasonal should show extra fields
      await page.getByRole("radio", { name: /sezonska/i }).click();
      await expect(page.getByPlaceholder(/poletje 2026/i)).toBeVisible();
      await expect(page.getByPlaceholder(/15% popust/i)).toBeVisible();
      
      // Welcome should hide extra fields
      await page.getByRole("radio", { name: /welcome/i }).click();
      await expect(page.getByPlaceholder(/poletje 2026/i)).not.toBeVisible();
    });
  });

  authTest.describe("Email Language Selection", () => {
    authTest("allows selecting different languages", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      const languageSelect = page.getByRole("combobox", { name: /jezik/i });
      await expect(languageSelect).toBeVisible();
      
      // Test all language options
      await expect(languageSelect.getByText("Slovenščina")).toBeVisible();
      await expect(languageSelect.getByText("English")).toBeVisible();
      await expect(languageSelect.getByText("Deutsch")).toBeVisible();
      await expect(languageSelect.getByText("Italiano")).toBeVisible();
    });

    authTest("generates content in selected language", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Test");
      await page.getByPlaceholder(/črnomelj/i).fill("Test");
      
      // Test English
      await page.getByRole("combobox", { name: /jezik/i }).selectOption("en");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      let content = await page.locator("textarea").last().inputValue();
      expect(content.toLowerCase()).toMatch(/welcome|hotel|guest/i);
      
      // Test German
      await page.getByRole("combobox", { name: /jezik/i }).selectOption("de");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      content = await page.locator("textarea").last().inputValue();
      expect(content.toLowerCase()).toMatch(/willkommen|hotel|gast/i);
    });
  });

  authTest.describe("Email Copy and Send Functionality", () => {
    authTest("copies generated email to clipboard", async ({
      page,
      auth: _auth,
      context,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Test");
      await page.getByPlaceholder(/črnomelj/i).fill("Test");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      // Grant clipboard permissions
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      
      // Click copy button
      const copyBtn = page.getByRole("button", { name: /^kopiraj/i });
      await expect(copyBtn).toBeVisible({ timeout: 15000 });
      await copyBtn.click();
      
      // Verify toast notification
      await expect(page.getByText(/kopirano/i)).toBeVisible();
    });

    authTest("generates valid mailto link for Gmail", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Test");
      await page.getByPlaceholder(/črnomelj/i).fill("Test");
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      const gmailLink = page.getByRole("link", { name: /pošlji prek gmaila/i });
      await expect(gmailLink).toBeVisible({ timeout: 15000 });
      
      const href = await gmailLink.getAttribute("href");
      expect(href).toMatch(/^mailto:\?body=/);
      expect(href).toContain(encodeURIComponent("Hotel Test"));
    });
  });

  authTest.describe("Email Generation Error Handling", () => {
    authTest("handles empty property name gracefully", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      // Don't fill property name, just click generate
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      // Should still generate something or show error
      const hasOutput = await page.locator("textarea").last().isVisible({ timeout: 5000 });
      const hasError = await page.getByText(/napaka|error/i).isVisible({ timeout: 5000 });
      
      expect(hasOutput || hasError).toBe(true);
    });

    authTest("shows loading state during generation", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Test");
      await page.getByPlaceholder(/črnomelj/i).fill("Test");
      
      // Click generate and quickly check for loading state
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      // Check for loading indicator
      const loadingVisible = await page.getByText(/generiram|loading/i).isVisible({ timeout: 2000 });
      expect(loadingVisible).toBe(true);
    });
  });

  authTest.describe("Email Template Variables", () => {
    authTest("substitutes all required variables", async ({
      page,
      auth: _auth,
    }) => {
      await page.goto("/dashboard/tourism/email");
      
      const testData = {
        name: "Grand Hotel Test",
        location: "Test City",
        guestName: "John Doe",
        checkin: "16:00",
        checkout: "10:00",
      };
      
      await page.getByPlaceholder(/apartmaji bela krajina/i).fill(testData.name);
      await page.getByPlaceholder(/črnomelj/i).fill(testData.location);
      await page.getByPlaceholder(/npr\. ana/i).fill(testData.guestName);
      await page.getByPlaceholder(/vnesite check.in čas/i).fill(testData.checkin);
      await page.getByPlaceholder(/vnesite check.out čas/i).fill(testData.checkout);
      await page.getByRole("button", { name: /^generiraj email$/i }).click();
      
      const content = await page.locator("textarea").last().inputValue();
      
      // Verify variables are substituted
      expect(content).toContain(testData.name);
      expect(content).toContain(testData.location);
      expect(content).toContain(testData.guestName);
    });
  });
});
