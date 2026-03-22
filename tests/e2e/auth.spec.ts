import { test, expect } from "./fixtures";

test.describe("Auth", () => {
  test("register and login flow", async ({ page }) => {
    await page.goto("/register");
    await page.getByLabel(/email/i).fill("newuser@test.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /register|create/i }).click();
    await expect(page).toHaveURL(/\/onboarding/);

    await page.goto("/login");
    await page.getByLabel(/email/i).fill("newuser@test.com");
    await page.getByLabel(/password/i).fill("password123");
    await page.getByRole("button", { name: /sign in|login/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  test("logout", async ({ page, auth: _auth }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /logout/i }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
