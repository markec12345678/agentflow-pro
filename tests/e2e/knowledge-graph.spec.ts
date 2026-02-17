import { test, expect } from "./fixtures";

test.describe("Knowledge Graph", () => {
  test("memory persistence across sessions", async ({ page, auth: _auth }) => {
    await page.goto("/memory");

    await page.getByLabel(/entity name/i).fill("e2e-test-entity");
    await page.getByLabel(/type/i).selectOption("Agent");
    await page.getByLabel(/observations/i).fill("E2E test observation");
    await page.getByRole("button", { name: /add entity/i }).click();

    await expect(page.getByText("e2e-test-entity")).toBeVisible({ timeout: 5000 });

    await page.reload();
    await expect(page.getByText("e2e-test-entity")).toBeVisible({ timeout: 5000 });
  });
});
