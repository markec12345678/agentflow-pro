/**
 * AgentFlow Pro - Finalna E2E Testna Checklista
 * Covers all 10 checklist items in one consolidated spec.
 */
import { test, expect } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

test.describe("AgentFlow Pro - Finalna E2E Checklista", () => {
  test("1. Export JSON downloada file", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

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
    expect(
      criticalErrors,
      `Console errors: ${criticalErrors.join("; ")}`
    ).toHaveLength(0);
  });

  test("2. Import JSON vrne node-e pravilno", async ({ page }) => {
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    const initialNodeCount = await page.locator("[data-id]").count();
    const initialEdgeCount = await page.locator(".react-flow__edge").count();

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByRole("button", { name: /Export JSON/i }).click();
    const download = await downloadPromise;
    const exportPath = await download.path();

    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(exportPath);

    await page.waitForTimeout(500);

    const afterImportCount = await page.locator("[data-id]").count();
    const afterEdgeCount = await page.locator(".react-flow__edge").count();
    expect(afterImportCount).toBe(initialNodeCount);
    expect(afterEdgeCount).toBe(initialEdgeCount);
  });

  test("3-8, 9, 10. Run Workflow - modal, progress bar, current agent, results, close, no console/server errors", async ({
    page,
  }) => {
    test.setTimeout(60000);
    page.on("dialog", (dialog) => dialog.accept());

    const consoleErrors: string[] = [];
    const apiResponses: { url: string; status: number }[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    page.on("response", (res) => {
      const url = res.url();
      if (url.includes("/api/workflows/execute")) {
        apiResponses.push({ url, status: res.status() });
      }
    });

    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    const simpleWorkflowPath = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "simple-workflow-trigger-action.json"
    );
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(simpleWorkflowPath);
    await page.waitForTimeout(500);

    const nodeCount = await page.locator("[data-id]").count();
    expect(nodeCount).toBeGreaterThanOrEqual(2);

    const edgeCount = await page.locator(".react-flow__edge").count();
    expect(edgeCount).toBeGreaterThanOrEqual(1);

    await page
      .getByRole("button", { name: /Run Workflow|Execute/i })
      .first()
      .click();

    await expect(page.getByTestId("execution-modal")).toBeVisible({
      timeout: 25000,
    });

    const modal = page.getByTestId("execution-modal");

    await expect(modal.getByText(/Step \d+ of \d+/)).toBeVisible({
      timeout: 5000,
    });
    await expect(modal.getByText("Execution Timeline")).toBeVisible({
      timeout: 5000,
    });

    const progressBar = modal.locator('[class*="bg-blue-600"]').first();
    await expect(progressBar).toBeVisible();
    const width = await progressBar.evaluate((el) =>
      parseFloat((el as HTMLElement).style.width || "0")
    );
    expect(width).toBeGreaterThan(0);

    const stepText = await modal.getByText(/Step \d+ of \d+/).textContent();
    expect(stepText).toBeTruthy();
    expect(stepText).toMatch(/\d+ of \d+/);

    const resultItems = modal.locator("ul li");
    await expect(resultItems.first()).toBeVisible({ timeout: 3000 });

    await modal.getByTestId("close-modal").click();

    await expect(page.getByTestId("execution-modal")).not.toBeVisible({
      timeout: 3000,
    });

    const criticalErrors = consoleErrors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("hydration") &&
        !e.includes("Warning:")
    );
    expect(
      criticalErrors,
      `Console errors: ${criticalErrors.join("; ")}`
    ).toHaveLength(0);

    const executeCalls = apiResponses.filter((r) =>
      r.url.includes("/api/workflows/execute")
    );
    expect(
      executeCalls.every((r) => r.status >= 200 && r.status < 300),
      `API returned non-2xx: ${JSON.stringify(executeCalls)}`
    ).toBe(true);
  });

  test("7. Errors se prikazujejo (invalid workflow)", async ({ page }) => {
    test.setTimeout(60000);
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    const fixturePath = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "invalid-workflow-no-trigger.json"
    );

    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(fixturePath);

    await page.waitForTimeout(500);

    const responsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/workflows/execute") &&
        res.request().method() === "POST"
    );
    await page
      .getByRole("button", { name: /Run Workflow|Execute/i })
      .first()
      .click();
    const response = await responsePromise;
    const body = await response.json();
    expect(body.progress).toBeDefined();
    expect(body.progress?.errors?.length).toBeGreaterThan(0);

    await page.waitForTimeout(500);
    const modal = page.getByTestId("execution-modal");
    await expect(modal).toBeVisible({ timeout: 10000 });

    await expect(modal.getByRole("heading", { name: "Errors" })).toBeVisible({
      timeout: 5000,
    });
    await expect(modal.getByText(/trigger|No trigger/i)).toBeVisible({
      timeout: 3000,
    });
  });
});
