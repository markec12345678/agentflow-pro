/**
 * E2E: Calendar - Nova rezervacija + overbooking
 */
import { test as authTest, expect } from "./fixtures";

authTest.describe("Calendar - Nova rezervacija", () => {
  authTest("Nova rezervacija happy path", async ({ page }) => {
    await page.goto("/dashboard/tourism/calendar");
    await page.waitForLoadState("networkidle");

    // Select property - calendar doesn't fetch activePropertyId, so select manually
    const propButton = page.getByRole("button", { name: /Nastanitev:/ });
    await propButton.click();
    const e2eOption = page.getByRole("option", { name: "E2E Test Nastanitev" });
    await expect(e2eOption).toBeVisible({ timeout: 5000 });
    await e2eOption.click();

    await page.getByRole("button", { name: "+ Nova rezervacija" }).click();

    const modal = page.getByRole("heading", { name: "Nova rezervacija" }).locator("../..");
    await modal.getByLabel("Prihod").fill("2025-12-01");
    await modal.getByLabel("Odhod").fill("2025-12-05");
    await modal.getByLabel("Ime gosta").fill("E2E Gost");
    await modal.getByLabel(/Celotna cena/).fill("200");

    await page.getByRole("button", { name: "Ustvari rezervacijo" }).click();

    await expect(page.getByText(/Rezervacija ustvarjena/i)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole("heading", { name: "Nova rezervacija" })).not.toBeVisible();
  });

  authTest("Overbooking: 409 → Ustvari vseeno", async ({ page }) => {
    await page.goto("/dashboard/tourism/calendar");
    await page.waitForLoadState("networkidle");

    const propButton = page.getByRole("button", { name: /Nastanitev:/ });
    await propButton.click();
    const e2eOption = page.getByRole("option", { name: "E2E Test Nastanitev" });
    await expect(e2eOption).toBeVisible({ timeout: 5000 });
    await e2eOption.click();

    // First reservation: 2025-12-10 to 2025-12-15
    await page.getByRole("button", { name: "+ Nova rezervacija" }).click();
    const modal1 = page.getByRole("heading", { name: "Nova rezervacija" }).locator("../..");
    await modal1.getByLabel("Prihod").fill("2025-12-10");
    await modal1.getByLabel("Odhod").fill("2025-12-15");
    await modal1.getByLabel("Ime gosta").fill("E2E Prvi");
    await modal1.getByLabel(/Celotna cena/).fill("250");
    await page.getByRole("button", { name: "Ustvari rezervacijo" }).click();
    await expect(page.getByText(/Rezervacija ustvarjena/i)).toBeVisible({ timeout: 5000 });

    // Second reservation - overlapping: 2025-12-12 to 2025-12-17 (expect 409)
    await page.getByRole("button", { name: "+ Nova rezervacija" }).click();
    const modal2 = page.getByRole("heading", { name: "Nova rezervacija" }).locator("../..");
    await modal2.getByLabel("Prihod").fill("2025-12-12");
    await modal2.getByLabel("Odhod").fill("2025-12-17");
    await modal2.getByLabel("Ime gosta").fill("E2E Drugi");
    await modal2.getByLabel(/Celotna cena/).fill("300");
    await page.getByRole("button", { name: "Ustvari rezervacijo" }).click();

    await expect(page.getByText(/Prekrivanje z obstoječo rezervacijo/i)).toBeVisible();
    await page.getByRole("button", { name: "Ustvari vseeno" }).click();

    await expect(page.getByText(/Rezervacija ustvarjena/i)).toBeVisible({ timeout: 5000 });
  });
});
