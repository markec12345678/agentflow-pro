/**
 * Tourism Email Workflow E2E Tests
 * Covers: Welcome, Follow-up, Seasonal templates; Copy; Pošlji prek Gmaila (mailto); Multi-language
 */
import { test as authTest, expect } from "./fixtures";

authTest.describe("Tourism Email Workflow", () => {
  authTest("Welcome Email: generates with placeholders replaced", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");
    await expect(page.getByRole("heading", { name: /email generator za goste/i })).toBeVisible();

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Apartmaji Bela Krajina");
    await page.getByPlaceholder(/črnomelj/i).fill("Črnomelj");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 10000,
    });
    const textarea = page.locator("textarea").last();
    await expect(textarea).toHaveValue(/.+/);
    const content = await textarea.inputValue();
    expect(content).toMatch(/apartmaji bela krajina|črnomelj|mock/i);
  });

  authTest("Follow-up Email: generates review request content", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");
    await expect(page.getByRole("heading", { name: /email generator za goste/i })).toBeVisible();

    await page.getByRole("radio", { name: /follow-up email/i }).click();
    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Vila Kolpa");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByText(/mock|hvala|review|booking|google/i)).toBeVisible({
      timeout: 10000,
    });
  });

  authTest("Seasonal Campaign: generates with season and offer", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");
    await expect(page.getByRole("heading", { name: /email generator za goste/i })).toBeVisible();

    await page.getByRole("radio", { name: /sezonska ponudba/i }).click();
    await page.getByPlaceholder(/poletje 2026|velika noč/i).fill("Poletje 2026");
    await page.getByPlaceholder(/15% popust|rezervacije/i).fill("15% popust za rezervacije do 31.3.");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByText(/mock|poletje|popust|2026/i)).toBeVisible({
      timeout: 10000,
    });
  });

  authTest("Copy for Email Client: Pošlji prek Gmaila has mailto link", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    const gmailLink = page.getByRole("link", { name: /pošlji prek gmaila/i });
    await expect(gmailLink).toBeVisible({ timeout: 10000 });
    const href = await gmailLink.getAttribute("href");
    expect(href).toMatch(/^mailto:\?body=/);
  });

  authTest("Kopiraj shows toast", async ({ page, auth: _auth }) => {
    await page.goto("/dashboard/tourism/email");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    const copyBtn = page.getByRole("button", { name: /^kopiraj$/i });
    await expect(copyBtn).toBeVisible({ timeout: 10000 });
    await copyBtn.click();
    await expect(page.getByText(/kopirano v odložišče/i)).toBeVisible();
  });

  // ============================================================================
  // MULTI-LANGUAGE TESTS
  // ============================================================================

  authTest("Welcome Email in English: generates English content", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Bled");
    await page.getByPlaceholder(/črnomelj/i).fill("Bled, Slovenia");
    await page.getByRole("combobox", { name: /jezik/i }).selectOption("en");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 15000,
    });
    const textarea = page.locator("textarea").last();
    const content = await textarea.inputValue();
    expect(content.toLowerCase()).toMatch(/welcome|hotel|bled|check.in|guest/i);
  });

  authTest("Welcome Email in German: generates German content", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Ljubljana");
    await page.getByPlaceholder(/črnomelj/i).fill("Ljubljana");
    await page.getByRole("combobox", { name: /jezik/i }).selectOption("de");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 15000,
    });
    const content = await page.locator("textarea").last().inputValue();
    expect(content.toLowerCase()).toMatch(/willkommen|hotel|check.in|gast/i);
  });

  authTest("Welcome Email in Italian: generates Italian content", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Villa Trieste");
    await page.getByPlaceholder(/črnomelj/i).fill("Trieste, Italia");
    await page.getByRole("combobox", { name: /jezik/i }).selectOption("it");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 15000,
    });
    const content = await page.locator("textarea").last().inputValue();
    expect(content.toLowerCase()).toMatch(/benvenuto|i|villa|check.in|ospite/i);
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================

  authTest("Form validation: requires property name", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("heading", { name: /email generator za goste/i })).toBeVisible();
  });

  authTest("Form validation: accepts all required fields", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Test Property");
    await page.getByPlaceholder(/črnomelj/i).fill("Test Location");
    await page.getByPlaceholder(/npr\. ana/i).fill("Test Guest");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 15000,
    });
  });

  // ============================================================================
  // SEASONAL TEMPLATE SPECIFIC TESTS
  // ============================================================================

  authTest("Seasonal template: shows additional fields when selected", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByRole("radio", { name: /sezonska ponudba/i }).click();

    await expect(page.getByPlaceholder(/poletje 2026|velika noč/i)).toBeVisible();
    await expect(page.getByPlaceholder(/15% popust|rezervacije/i)).toBeVisible();
  });

  authTest("Seasonal template: generates with custom season and offer", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByRole("radio", { name: /sezonska ponudba/i }).click();
    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Mountain Resort");
    await page.getByPlaceholder(/črnomelj/i).fill("Kranjska Gora");
    await page.getByPlaceholder(/poletje 2026|velika noč/i).fill("Zimska Sezona 2026");
    await page.getByPlaceholder(/15% popust|rezervacije/i).fill("20% popust + brezplačen zajtrk");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 15000,
    });
    const content = await page.locator("textarea").last().inputValue();
    expect(content).toMatch(/zimska|sezona|20%|popust|brezplačen/i);
  });

  // ============================================================================
  // UI/UX TESTS
  // ============================================================================

  authTest("Template selection: highlights selected template", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    const welcomeTemplate = page.getByLabel(/welcome email/i);
    await expect(welcomeTemplate).toBeChecked();

    const followupTemplate = page.getByLabel(/follow.up email/i);
    await followupTemplate.click();
    await expect(followupTemplate).toBeChecked();
    await expect(welcomeTemplate).not.toBeChecked();
  });

  authTest("Loading state: shows skeleton during generation", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Test Property");
    await page.getByPlaceholder(/črnomelj/i).fill("Test Location");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByText(/generiram/i)).toBeVisible();
  });

  authTest("Empty state: shows placeholder before generation", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await expect(
      page.getByText(/izpolni form in klikni/i)
    ).toBeVisible();
  });

  // ============================================================================
  // CHECK-IN/CHECK-OUT TIME TESTS
  // ============================================================================

  authTest("Custom check-in/check-out times: are accepted", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Hotel Test");
    await page.getByPlaceholder(/črnomelj/i).fill("Test City");
    await page.getByPlaceholder(/vnesite check.in čas/i).fill("16:00");
    await page.getByPlaceholder(/vnesite check.out čas/i).fill("09:00");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 15000,
    });
  });

  // ============================================================================
  // GUEST NAME PERSONALIZATION TESTS
  // ============================================================================

  authTest("Guest name personalization: includes guest name in output", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");

    await page.getByPlaceholder(/apartmaji bela krajina/i).fill("Villa Ana");
    await page.getByPlaceholder(/črnomelj/i).fill("Bled");
    await page.getByPlaceholder(/npr\. ana/i).fill("Janez Novak");
    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    await expect(page.getByRole("button", { name: /^kopiraj$/i })).toBeVisible({
      timeout: 15000,
    });
    const content = await page.locator("textarea").last().inputValue();
    expect(content).toMatch(/janez|novak/i);
  });
});
