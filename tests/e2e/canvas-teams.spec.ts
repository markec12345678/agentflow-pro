/**
 * E2E Tests - Canvas and Teams
 */
import { test, expect } from "./fixtures";

test.describe("Canvas", () => {
  test("load /canvas, create board, verify in list", async ({ page, auth: _auth }) => {
    test.skip(
      !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder"),
      "Requires DATABASE_URL"
    );
    test.setTimeout(30000);

    await page.goto("/canvas");
    await expect(page.getByRole("heading", { name: /Campaign Canvas/i })).toBeVisible({ timeout: 10000 });

    await page.getByRole("button", { name: /New Board/i }).click();
    await expect(page).toHaveURL(/\/canvas\?id=/);
    await page.waitForLoadState("networkidle");

    await page.goto("/canvas");
    await expect(page.getByRole("heading", { name: /Campaign Canvas/i })).toBeVisible();
    const boardLinks = page.locator('a[href*="/canvas?id="]');
    await expect(boardLinks.first()).toBeVisible({ timeout: 5000 });
    expect(await boardLinks.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe("Teams", () => {
  test("load /settings/teams, create team", async ({ page, auth: _auth }) => {
    test.skip(
      !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder"),
      "Requires DATABASE_URL"
    );
    test.setTimeout(30000);

    await page.goto("/settings/teams");
    await expect(page.getByRole("heading", { name: /Teams/i })).toBeVisible({ timeout: 10000 });

    const teamName = `E2E Team ${Date.now()}`;
    await page.getByPlaceholder(/Team name/i).fill(teamName);
    await page.getByRole("button", { name: /Create Team/i }).click();

    await expect(page.getByText(teamName)).toBeVisible({ timeout: 5000 });
  });
});
