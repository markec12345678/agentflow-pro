/**
 * Workflow Builder E2E Checklist
 * 1. Add Nodes - all 4 agents (Research, Content, Code, Deploy)
 * 2. Connect Nodes - draw edges between nodes
 * 3. Conditions - IF/ELSE logic, operators (eq, contains, gt, lt)
 * 4. Execute Workflow - run and read execution progress
 * 5. Save/Load - save, load by ID, edit
 * 6. Export/Import - export JSON, import in new browser context
 */
import { test, expect } from "./fixtures";
import * as fs from "fs";
import * as path from "path";

test.describe.serial("Workflow Builder", () => {
  test.setTimeout(60000);

  test("1. Add nodes - all 4 agents", async ({ page, auth: _auth }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: /New Workflow/i }).click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    const canvas = page.getByTestId("workflow-drop-zone");

    for (let i = 0; i < 3; i++) {
      await sidebar.getByText("Agent").dragTo(canvas, {
        targetPosition: { x: 350 + i * 150, y: 100 },
      });
      await page.waitForTimeout(200);
    }

    const agentTypes = ["research", "content", "code", "deploy"] as const;
    const agentLabels = ["Research Agent", "Content Agent", "Code Agent", "Deploy Agent"];
    const agentNodes = page.locator('[data-id]').filter({ hasText: /Agent/i });

    for (let i = 0; i < 4; i++) {
      const node = agentNodes.nth(i);
      await node.click();
      await page.waitForTimeout(200);
      const select = page.locator("aside").last().locator("select").first();
      await select.selectOption(agentTypes[i]);
      await page.waitForTimeout(200);
    }

    for (const label of agentLabels) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("2. Connect nodes", async ({ page, auth: _auth }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: /New Workflow/i }).click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    const canvas = page.getByTestId("workflow-drop-zone");

    await sidebar.getByText("Trigger").dragTo(canvas, { targetPosition: { x: 50, y: 150 } });
    await sidebar.getByText("Agent").dragTo(canvas, { targetPosition: { x: 250, y: 150 } });
    await page.waitForTimeout(500);

    const triggerNode = page.locator('[data-id]').filter({ hasText: "Trigger" }).first();
    const agentNode = page.locator('[data-id]').filter({ hasText: /Research|Agent/ }).first();

    if ((await triggerNode.count()) > 0 && (await agentNode.count()) > 0) {
      const sourceHandle = triggerNode.locator(".react-flow__handle").last();
      const targetHandle = agentNode.locator(".react-flow__handle").first();
      await sourceHandle.dragTo(targetHandle);
      await page.waitForTimeout(300);
    }

    const edgeCount = await page.locator(".react-flow__edge").count();
    expect(edgeCount).toBeGreaterThanOrEqual(1);
  });

  test("3. Conditions - IF/ELSE and operators", async ({ page, auth: _auth }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    const fixturePath = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "workflow-with-condition.json"
    );
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(800);

    const conditionNode = page.locator('[data-id]').filter({ hasText: "Condition" }).first();
    await conditionNode.click();
    await page.waitForTimeout(300);

    const propsPanel = page.locator("aside").last();
    await expect(propsPanel.getByText("Operator")).toBeVisible();
    await expect(propsPanel.getByText("Operand A")).toBeVisible();
    await expect(propsPanel.getByText("Operand B")).toBeVisible();

    const operatorSelect = propsPanel.locator("select").first();
    await operatorSelect.selectOption("contains");
    await page.waitForTimeout(200);
    await operatorSelect.selectOption("gt");
    await page.waitForTimeout(200);
    await operatorSelect.selectOption("lt");
    await page.waitForTimeout(200);
    await operatorSelect.selectOption("eq");
  });

  test("4. Execute workflow - progress modal", async ({ page, auth: _auth }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    const fixturePath = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "simple-workflow-trigger-action.json"
    );
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(500);

    await page.getByRole("button", { name: /Run Workflow|Execute/i }).first().click();

    await expect(page.getByTestId("execution-modal")).toBeVisible({ timeout: 25000 });

    const modal = page.getByTestId("execution-modal");
    await expect(modal.getByText(/Step \d+ of \d+/)).toBeVisible({ timeout: 5000 });
    await expect(modal.getByText("Execution Timeline")).toBeVisible({ timeout: 5000 });

    const progressBar = modal.locator('[class*="bg-blue-600"]').first();
    await expect(progressBar).toBeVisible();

    await modal.getByTestId("close-modal").click();
    await expect(page.getByTestId("execution-modal")).not.toBeVisible({ timeout: 3000 });
  });

  test("5. Save/Load - persist and edit", async ({ page, auth: _auth }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    await page.getByRole("button", { name: /New Workflow/i }).click();
    await page.waitForTimeout(500);

    const sidebar = page.locator("aside").first();
    const canvas = page.getByTestId("workflow-drop-zone");
    await sidebar.getByText("Trigger").dragTo(canvas, { targetPosition: { x: 100, y: 100 } });
    await sidebar.getByText("Agent").dragTo(canvas, { targetPosition: { x: 350, y: 100 } });
    await page.waitForTimeout(500);

    const saveResponsePromise = page.waitForResponse(
      (res) =>
        res.url().includes("/api/workflows") &&
        !res.url().includes("execute") &&
        res.request().method() === "POST"
    );
    await page.getByRole("button", { name: /Save Workflow/i }).click();
    const saveResponse = await saveResponsePromise;
    const saveBody = await saveResponse.json();
    const workflowId = saveBody.id;
    expect(workflowId).toBeTruthy();

    await expect(page.getByText(/Saved/i)).toBeVisible({ timeout: 5000 });

    await page.goto(`/workflows?id=${workflowId}`);
    await page.waitForTimeout(1000);

    const nodeCount = await page.locator("[data-id]").count();
    expect(nodeCount).toBeGreaterThanOrEqual(2);

    const firstAgent = page.locator('[data-id]').filter({ hasText: /Research|Agent/ }).first();
    await firstAgent.click();
    await page.waitForTimeout(300);

    const labelInput = page.locator("aside").last().locator('input[type="text"]:not([disabled])').first();
    await labelInput.fill("E2E Test Agent");
    await page.waitForTimeout(200);

    await expect(page.getByText("E2E Test Agent")).toBeVisible();
  });

  test("6. Export/Import - import in new context", async ({ page, browser, auth: _auth }) => {
    page.on("dialog", (dialog) => dialog.accept());
    await page.goto("/workflows");
    await page.waitForTimeout(1000);

    const fixturePath = path.join(
      process.cwd(),
      "tests",
      "fixtures",
      "simple-workflow-trigger-action.json"
    );
    const fileInput = page.locator('input[type="file"][accept=".json"]');
    await fileInput.setInputFiles(fixturePath);
    await page.waitForTimeout(500);

    const beforeNodeCount = await page.locator("[data-id]").count();
    const beforeEdgeCount = await page.locator(".react-flow__edge").count();

    const downloadPromise = page.waitForEvent("download", { timeout: 10000 });
    await page.getByRole("button", { name: /Export JSON/i }).click();
    const download = await downloadPromise;
    const exportPath = await download.path();
    expect(exportPath).toBeTruthy();

    const outDir = path.join(process.cwd(), "test-results");
    const tempPath = path.join(outDir, "workflow-export-temp.json");
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.copyFileSync(exportPath, tempPath);

    await page.context().storageState({ path: path.join(outDir, "auth-state.json") });

    const context2 = await browser.newContext({
      storageState: path.join(outDir, "auth-state.json"),
    });
    const page2 = await context2.newPage();
    page2.on("dialog", (dialog) => dialog.accept());

    await page2.goto("/workflows");
    await page2.waitForTimeout(1000);

    const fileInput2 = page2.locator('input[type="file"][accept=".json"]');
    await fileInput2.setInputFiles(tempPath);
    await page2.waitForTimeout(800);

    const afterNodeCount = await page2.locator("[data-id]").count();
    const afterEdgeCount = await page2.locator(".react-flow__edge").count();

    expect(afterNodeCount).toBe(beforeNodeCount);
    expect(afterEdgeCount).toBe(beforeEdgeCount);

    await context2.close();
  });
});
