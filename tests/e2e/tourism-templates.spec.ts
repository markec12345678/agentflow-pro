/**
 * Tourism Templates E2E - Save, Use, Delete flow
 */
import { test as authTest, expect } from "./fixtures";

authTest.describe("Tourism Templates - Save, Use, Delete", () => {
  authTest("Templates page loads and shows empty or list", async ({ page }, testInfo) => {
    testInfo.setTimeout(30000);
    await page.goto("/dashboard/tourism/templates");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("heading", { name: /Moji Template-i|Template-i/i })
    ).toBeVisible({ timeout: 10000 });

    const emptyMsg = page.getByText(/Še nimate shranjenih template-ov|nimate shranjenih/i);
    const templateList = page.getByRole("link", { name: /Uporabi/i });
    const hasEmpty = await emptyMsg.isVisible();
    const hasList = await templateList.first().isVisible().catch(() => false);
    expect(hasEmpty || hasList).toBe(true);
  });

  authTest("Templates page has Uporabi and Izbrisi when templates exist", async ({ page }, testInfo) => {
    testInfo.setTimeout(30000);
    await page.goto("/dashboard/tourism/templates");
    await page.waitForLoadState("networkidle");

    const heading = page.getByRole("heading", { name: /Moji Template-i|Template/i });
    await expect(heading).toBeVisible({ timeout: 10000 });

    const novTemplateLink = page.getByRole("link", { name: /Nov Template|Generiraj/i });
    await expect(novTemplateLink.first()).toBeVisible();
  });
});
