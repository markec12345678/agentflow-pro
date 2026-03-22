import { test, expect } from "./fixtures";

test.describe("Copy Buttons", () => {
  test("Tourism Generate: Kopiraj za Booking.com shows toast", async ({
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

    await page.getByRole("button", { name: /kopiraj za booking\.com/i }).click();
    await expect(page.getByText(/kopirano v formatu za booking\.com/i)).toBeVisible();
  });

  test("Tourism Generate: Kopiraj za Airbnb shows toast", async ({
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

    await page.getByRole("button", { name: /kopiraj za airbnb/i }).click();
    await expect(page.getByText(/kopirano v formatu za airbnb/i)).toBeVisible();
  });

  test("Tourism Generate: Kopiraj hashtags shows toast", async ({
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

    await page.getByRole("button", { name: /kopiraj hashtags/i }).click();
    await expect(page.getByText(/hashtagi kopirani/i)).toBeVisible();
  });

  test("Tourism Email: Kopiraj shows toast", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/email");
    await expect(page.getByText(/email generator za goste/i)).toBeVisible();

    await page.getByRole("button", { name: /^generiraj email$/i }).click();

    const copyBtn = page.getByRole("button", { name: /^kopiraj$/i });
    await expect(copyBtn).toBeVisible({ timeout: 10000 });

    await copyBtn.click();
    await expect(page.getByText(/kopirano v odložišče/i)).toBeVisible();
  });

  test("Tourism Translate: Kopiraj on translation shows toast", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/dashboard/tourism/translate");
    await expect(page.getByText(/multi-language batch translator/i)).toBeVisible();

    await page
      .getByPlaceholder(/vstavi besedilo za prevod/i)
      .fill("Dobrodošli v našem apartmaju.");
    await page.getByRole("button", { name: /prevedi v izbrane jezike/i }).click();

    await expect(page.getByText(/prevodi/i)).toBeVisible({ timeout: 15000 });

    await page.getByRole("button", { name: /kopiraj prevod english/i }).first().click();
    await expect(page.getByText(/kopirano/i)).toBeVisible();
  });
});
