import { test, expect } from "@playwright/test";
import * as fs from "fs";

test.describe("Workflow Export/Import", () => {
  test("export workflow downloads valid JSON", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    // Set up download listener before clicking
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByRole("button", { name: /Export JSON/i }).click();
    const download = await downloadPromise;

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const content = fs.readFileSync(downloadPath, "utf-8");
    const data = JSON.parse(content);

    expect(data).toHaveProperty("nodes");
    expect(data).toHaveProperty("edges");
    expect(data).toHaveProperty("metadata");
    expect(Array.isArray(data.nodes)).toBe(true);
    expect(Array.isArray(data.edges)).toBe(true);
    expect(data.metadata).toHaveProperty("name");
    expect(data.metadata).toHaveProperty("exportedAt");

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("hydration") &&
        !e.includes("Warning:")
    );
    expect(criticalErrors, `Console errors: ${criticalErrors.join("; ")}`).toHaveLength(0);
  });

  test("import workflow restores nodes and edges", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    const initialNodeCount = await page.locator('[data-id]').count();
    const initialEdgeCount = await page.locator(".react-flow__edge").count();

    // Export first
    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByRole("button", { name: /Export JSON/i }).click();
    const download = await downloadPromise;
    const exportPath = await download.path();

    // Import the same file
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(exportPath);

    await page.waitForTimeout(500);

    const afterImportCount = await page.locator('[data-id]').count();
    const afterEdgeCount = await page.locator(".react-flow__edge").count();
    expect(afterImportCount).toBe(initialNodeCount);
    expect(afterEdgeCount).toBe(initialEdgeCount);
  });
});
