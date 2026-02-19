/**
 * Tourism Email Workflow E2E Tests
 * Covers: Welcome, Follow-up, Seasonal templates; Copy; Pošlji prek Gmaila (mailto)
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
});
