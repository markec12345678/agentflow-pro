/**
 * Receptor UI E2E tests
 * Tourism Hub, Today Overview, Calendar, Notification panel
 */
import { test, expect } from "@playwright/test";

test.describe("Receptor UI", () => {
  test("Tourism Hub loads or redirects to login", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/dashboard/tourism");
    await page.waitForLoadState("networkidle");
    const tourismHeading = page.getByRole("heading", { name: /Tourism Hub/i });
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    const hasContent =
      (await tourismHeading.isVisible()) || (await loginHeading.isVisible());
    expect(hasContent).toBe(true);
  });

  test("Today Overview cards visible when data exists", async ({ page }) => {
    test.skip(
      !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder"),
      "Requires DATABASE_URL"
    );
    test.setTimeout(30000);
    await page.goto("/dashboard/tourism");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    if (await loginHeading.isVisible()) {
      test.skip(true, "Requires auth - redirect to login");
      return;
    }
    await page.waitForTimeout(2000);
    const prihodov = page.getByText("Prihodov", { exact: false });
    const odhodov = page.getByText("Odhodov", { exact: false });
    const vNastanitvi = page.getByText("V nastanitvi", { exact: false });
    const hasAnyCard =
      (await prihodov.isVisible()) || (await odhodov.isVisible()) || (await vNastanitvi.isVisible());
    expect(hasAnyCard).toBe(true);
  });

  test("Calendar loads and month navigation works", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/dashboard/tourism/calendar");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    const calendarContent = page.locator("button:has-text('←'), button:has-text('→')");
    const hasContent =
      (await loginHeading.isVisible()) || (await calendarContent.first().isVisible().catch(() => false));
    expect(hasContent).toBe(true);
    if (await loginHeading.isVisible()) return;
    const prevBtn = page.getByRole("button", { name: "←" }).first();
    const nextBtn = page.getByRole("button", { name: "→" }).first();
    const hasNav = (await prevBtn.isVisible().catch(() => false)) || (await nextBtn.isVisible().catch(() => false));
    expect(hasNav).toBe(true);
    if (await nextBtn.isVisible()) {
      await nextBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test("Notification panel visible on desktop when tourism user", async ({ page }) => {
    test.setTimeout(30000);
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto("/dashboard/tourism");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    if (await loginHeading.isVisible()) {
      test.skip(true, "Requires auth");
      return;
    }
    const obvestilaNavLink = page.getByRole("link", { name: "Obvestila" });
    if (!(await obvestilaNavLink.isVisible().catch(() => false))) {
      test.skip(true, "Tourism nav not shown (not tourism user)");
      return;
    }
    await page.waitForTimeout(2000);
    const collapseBtn = page.getByRole("button", { name: /Strni panel/i });
    const expandBtn = page.getByRole("button", { name: /Odpri obvestila/i });
    const obvestilaHeading = page.getByRole("heading", { name: "Obvestila" });
    const hasNotificationUI =
      (await collapseBtn.isVisible().catch(() => false)) ||
      (await expandBtn.isVisible().catch(() => false)) ||
      (await obvestilaHeading.isVisible().catch(() => false));
    expect(hasNotificationUI).toBe(true);
  });

  test("Notifications page loads", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/dashboard/tourism/notifications");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    const obvestilaHeading = page.getByRole("heading", { name: /Obvestila/i });
    const hasContent =
      (await loginHeading.isVisible()) || (await obvestilaHeading.isVisible());
    expect(hasContent).toBe(true);
  });
});
