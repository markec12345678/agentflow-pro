/**
 * AgentFlow Pro - Smoke Checklist E2E Tests
 * Covers: Simple Mode, Advanced Mode, Database Save, All Pages
 */
import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("1. Simple Mode - /generate", () => {
  test("topic input, Generate click, posts displayed", async ({ page }) => {
    test.setTimeout(90000);
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/generate?mock=1");
    await expect(page.getByRole("heading", { name: /Generate Blog Posts/i })).toBeVisible();
    await page.waitForLoadState("networkidle");

    await page.getByTestId("generate-topic-input").fill("AI automation");
    await page.waitForTimeout(300);

    await page.getByTestId("generate-posts-button").click();

    await expect(page.getByText("Your Blog Posts")).toBeVisible({ timeout: 60000 });

    const postCards = page.locator('[data-testid="posts-results"] .rounded-xl');
    await expect(postCards.first()).toBeVisible({ timeout: 5000 });
    expect(await postCards.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe("2. Advanced Mode - /workflows", () => {
  test("create workflow, Run, Execution Progress, Export, Import", async ({
    page,
  }) => {
    test.setTimeout(60000);
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/workflows");
    await page.waitForTimeout(1500);

    const fixturePath = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "simple-workflow-trigger-action.json"
    );
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(500);

    const nodeCount = await page.locator("[data-id]").count();
    expect(nodeCount).toBeGreaterThanOrEqual(2);

    await page.getByRole("button", { name: /Run Workflow|▶ Run Workflow/i }).first().click();

    await expect(page.getByTestId("execution-modal")).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(/Step \d+ of \d+/)).toBeVisible({ timeout: 5000 });
    await page.getByTestId("close-modal").click();
    await expect(page.getByTestId("execution-modal")).not.toBeVisible({ timeout: 3000 });

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByRole("button", { name: /Export JSON|📥 Export JSON/i }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();

    const importFileInput = page.locator('input[type="file"][accept=".json"]');
    await importFileInput.setInputFiles(downloadPath);
    await page.waitForTimeout(500);

    const afterImportNodes = await page.locator("[data-id]").count();
    expect(afterImportNodes).toBeGreaterThanOrEqual(2);
  });
});

test.describe("3. Database - Save workflow & Dashboard", () => {
  test("save workflow, open Dashboard, verify Saved Workflows section", async ({
    page,
  }) => {
    test.skip(
      !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder"),
      "Requires DATABASE_URL (run: db:push)"
    );
    test.setTimeout(60000);
    page.on("dialog", (dialog) => dialog.accept());

    await page.goto("/workflows");
    await page.waitForTimeout(1500);

    const fixturePath = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "simple-workflow-trigger-action.json"
    );
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(800);

    await page.getByRole("button", { name: /Save Workflow|💾 Save Workflow/i }).click();
    await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });

    await page.goto("/dashboard", { waitUntil: "networkidle", timeout: 30000 });
    await expect(page.getByRole("heading", { name: /Agent Dashboard/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole("heading", { name: /Saved Workflows/i })).toBeVisible({ timeout: 15000 });

    const workflowCards = page.locator('a[href*="/workflows?id="]');
    expect(await workflowCards.count()).toBeGreaterThanOrEqual(1);
  });
});

test.describe("4. All Pages - Smoke", () => {
  test("Homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: /Automate Your Content/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Start Free 7-Day Trial/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Build Workflow \(Advanced\)/i })).toBeVisible();
  });

  test("Dashboard loads", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByRole("heading", { name: /Agent Dashboard/i })).toBeVisible();
  });

  test("Pricing loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Simple, Transparent Pricing/i })).toBeVisible();
    await expect(page.getByText(/Pro|Business/i)).toBeVisible();
  });

  test("Contact loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /Get in Touch/i })).toBeVisible();
  });

  test("Monitoring loads", async ({ page }) => {
    await page.goto("/monitoring");
    await expect(page.getByRole("heading", { name: /System Monitoring/i })).toBeVisible();
  });
});

test.describe("5. API Health", () => {
  test("/api/health returns 200 and ok:true when DB is available", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
