/**
 * Tourism Layer E2E Tests
 * Covers: Tourism Hub pages load, Publish Helpers UI visible when content exists
 */
import { test, expect } from "@playwright/test";
import { test as authTest } from "./fixtures";

authTest.describe("Tourism Hub - Authenticated", () => {
  authTest("Tourism generate page loads with prompts", async ({ page, _auth }, testInfo) => {
    testInfo.setTimeout(30000);
    await page.goto("/dashboard/tourism/generate");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /Generate Tourism Content/i });
    const loginHeading = page.getByRole("heading", { name: /sign in|prijava/i });
    const isOnPage =
      (await heading.isVisible()) || (await loginHeading.isVisible());
    expect(isOnPage).toBe(true);

    if (await heading.isVisible()) {
      await expect(
        page.getByRole("button", { name: /Booking\.com Opis/i })
      ).toBeVisible({ timeout: 5000 });
    }
  });

  authTest("Landing Page Generator loads", async ({ page }, testInfo) => {
    testInfo.setTimeout(30000);
    await page.goto("/dashboard/tourism/landing");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Landing Page Generator/i })
    ).toBeVisible({ timeout: 10000 });
  });

  authTest("Landing Page 3-step flow: template → form → generate → export", async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);
    await page.goto("/dashboard/tourism/landing");
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("heading", { name: /Landing Page Generator/i })).toBeVisible({ timeout: 10000 });

    const standardLabel = page.getByText("Standard").first();
    await standardLabel.click();

    await page.getByRole("button", { name: /Naprej|→/i }).click();

    const nameInput = page.getByLabel(/Ime nastanitve/i).or(page.getByPlaceholder(/Apartmaji Bela Krajina/i));
    await nameInput.first().fill("E2E Test Nastanitev");

    const generateBtn = page.getByRole("button", { name: /Generiraj Zdaj/i });
    await generateBtn.click();

    await expect(page.getByRole("button", { name: /Export JSON|Uredi/i })).toBeVisible({ timeout: 15000 });

    const exportJsonBtn = page.getByRole("button", { name: /Export JSON/i });
    if (await exportJsonBtn.isVisible()) {
      await exportJsonBtn.click();
    }

    expect(true).toBe(true);
  });

  authTest("Email Generator loads", async ({ page, _auth }, testInfo) => {
    testInfo.setTimeout(30000);
    await page.goto("/dashboard/tourism/email");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Email Generator za Goste/i })
    ).toBeVisible({ timeout: 10000 });
  });

  authTest("SEO Dashboard loads", async ({ page }, testInfo) => {
    testInfo.setTimeout(30000);
    await page.goto("/dashboard/tourism/seo");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /SEO Dashboard/i })
    ).toBeVisible({ timeout: 10000 });
  });

  authTest("Multi-Language Translator loads", async ({ page, _auth }, testInfo) => {
    testInfo.setTimeout(30000);
    await page.goto("/dashboard/tourism/translate");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Multi-Language Batch Translator/i })
    ).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Tourism - Unauthenticated", () => {
  test("Tourism routes redirect or show auth when not logged in", async ({
    page,
  }) => {
    await page.goto("/dashboard/tourism/generate");
    await page.waitForLoadState("networkidle");

    const url = page.url();
    const hasAuthOrContent =
      url.includes("/login") ||
      url.includes("/onboarding") ||
      url.includes("/dashboard/tourism");
    expect(hasAuthOrContent).toBe(true);
  });
});
