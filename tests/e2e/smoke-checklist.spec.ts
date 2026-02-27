/**
 * AgentFlow Pro - Smoke Checklist E2E Tests
 * Covers: Simple Mode, Advanced Mode, Database Save, All Pages
 */
import { test, expect } from "@playwright/test";
import * as path from "path";

test.describe("1. Simple Mode - /generate", () => {
  test("generate page loads or redirects to login", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/generate");
    await page.waitForLoadState("networkidle");
    const generateHeading = page.getByRole("heading", { name: /Ustvari vsebino|Opis nastanitve/i });
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    const hasContent =
      (await generateHeading.isVisible()) || (await loginHeading.isVisible());
    expect(hasContent).toBe(true);
  });
});

test.describe("2. Advanced Mode - /workflows", () => {
  test("workflows page loads or redirects to login", async ({ page }) => {
    test.setTimeout(30000);
    await page.goto("/workflows");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    const workflowLink = page.getByRole("link", { name: /Workflow|Builder/i });
    const hasContent =
      (await loginHeading.isVisible()) ||
      (await workflowLink.first().isVisible().catch(() => false));
    expect(hasContent).toBe(true);
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

test.describe("4. Phase E – Auth Pages (Forgot/Reset/Verify)", () => {
  test("Forgot password page loads with form", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByRole("heading", { name: /Pozabljeno geslo/i })).toBeVisible();
    await expect(page.getByPlaceholder("vas@email.com")).toBeVisible();
    await expect(page.getByRole("button", { name: /Pošlji povezavo/i })).toBeVisible();
  });

  test("Reset password without token shows invalid link", async ({ page }) => {
    await page.goto("/reset-password");
    await expect(
      page.getByRole("heading", { name: /Neveljavna povezava/i })
    ).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole("link", { name: /Nazaj na prijavo/i })).toBeVisible();
  });

  test("Reset password with token shows form", async ({ page }) => {
    await page.goto("/reset-password?token=fake-token-for-smoke");
    await expect(page.getByRole("heading", { name: /Ponastavitev gesla/i })).toBeVisible();
    await expect(page.getByPlaceholder("Vsaj 8 znakov")).toBeVisible();
  });

  test("Verify email page loads", async ({ page }) => {
    await page.goto("/verify-email?token=fake-token");
    await expect(
      page.getByText(/Potrjevanje e-pošte|E-pošta potrjena|Napaka|Nazaj na prijavo/i)
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("5. All Pages - Smoke", () => {
  test("Homepage loads", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Two Ways to Use|Generate|booking descriptions/i }).first()
    ).toBeVisible();
  });

  test("Dashboard loads or redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const loginHeading = page.getByRole("heading", { name: /Sign in|Prijava/i });
    const navLink = page.getByRole("link", { name: /Pregled|Ustvari/i });
    const hasContent =
      (await loginHeading.isVisible()) ||
      (await navLink.first().isVisible().catch(() => false));
    expect(hasContent).toBe(true);
  });

  test("Pricing loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { name: /Simple, Transparent Pricing/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pro" })).toBeVisible();
  });

  test("Contact loads", async ({ page }) => {
    await page.goto("/contact");
    await expect(page.getByRole("heading", { name: /Get in Touch/i })).toBeVisible();
  });

  test("Monitoring loads", async ({ page }) => {
    test.setTimeout(45000);
    await page.goto("/monitoring", { waitUntil: "domcontentloaded", timeout: 20000 });
    await expect(
      page.getByRole("heading", { name: /System Monitoring|Monitoring/i })
    ).toBeVisible({ timeout: 15000 });
  });
});

test.describe("6. API Health", () => {
  test("/api/health returns 200 and ok:true when DB is available", async ({
    request,
  }) => {
    const res = await request.get("/api/health");
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});

test.describe("7. Blok C – Tourism Multi-Agent, Analytics, KG", () => {
  test("POST /api/tourism/faq with useMultiAgent returns answer with source", async ({
    request,
  }) => {
    test.skip(
      !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder"),
      "Tourism FAQ requires DATABASE_URL"
    );
    const res = await request.post("/api/tourism/faq", {
      data: {
        question: "Kdaj je check-in?",
        propertyId: "smoke-test-prop",
        useMultiAgent: true,
      },
    });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("answer");
    expect(typeof body.answer).toBe("string");
    expect(body.answer.length).toBeGreaterThan(0);
    // With multi-agent, expect source when LLM available, else keyword match
    expect(body.source === "multi-agent" || body.category || body.confidence !== undefined).toBe(true);
  });

  test("GET /api/tourism/analytics returns predictive block", async ({
    request,
  }) => {
    test.skip(true, "Tourism analytics require session auth - run in full e2e");
    const res = await request.get(
      "/api/tourism/analytics?propertyId=smoke-test-prop&period=30d"
    );
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("predictive");
    expect(body.predictive).toMatchObject({
      forecastNightsNext30d: expect.any(Number),
      forecastBookingsNext30d: expect.any(Number),
      forecastRevenueNext30d: expect.any(Number),
      trendDirection: expect.stringMatching(/^(up|down|stable)$/),
      confidence: expect.any(Number),
    });
    expect(body).toHaveProperty("summary");
  });

  test("Dashboard tourism analytics page loads with property selector", async ({
    page,
  }) => {
    test.skip(
      !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder"),
      "Requires DATABASE_URL"
    );
    await page.goto("/dashboard/tourism/analytics");
    await page.waitForLoadState("networkidle");
    const heading = page.getByRole("heading", {
      name: /analitika|napoved|turizem/i,
    });
    const loginPrompt = page.getByRole("heading", { name: /sign in|prijava/i });
    const hasContent =
      (await heading.isVisible()) || (await loginPrompt.isVisible());
    expect(hasContent).toBe(true);
  });
});
