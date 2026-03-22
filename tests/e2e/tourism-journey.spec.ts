/**
 * Tourism full user journey E2E
 * Flow: Generate page → Select prompt → Fill variables → Generate → Translate
 */
import { test as authTest, expect } from "./fixtures";

authTest.describe("Tourism Journey", () => {
  authTest("Generate → Translate minimal happy path", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/generate");
    await expect(page.getByText(/generate tourism content/i)).toBeVisible();

    await page.getByRole("button", { name: /booking\.com opis/i }).click();
    await page.getByRole("button", { name: /^generate$/i }).click();

    await expect(page.getByText(/mock|generirana/i)).toBeVisible({
      timeout: 15000,
    });

    await page.goto("/dashboard/tourism/translate");
    await expect(page.getByText(/multi-language batch translator/i)).toBeVisible();

    await page
      .getByPlaceholder(/vstavi besedilo za prevod/i)
      .fill("Dobrodošli v našem apartmaju v Bela Krajini.");
    await page.getByRole("button", { name: /prevedi v izbrane jezike/i }).click();

    await expect(page.getByText(/prevodi|mock en/i)).toBeVisible({
      timeout: 15000,
    });
  });
});
