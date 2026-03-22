import { test, expect } from "./fixtures";

test.describe("Chat Interface", () => {
  test("streaming: send message and see streaming indicator then assistant reply", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/chat");
    await expect(page.getByPlaceholder(/napiši prompt/i)).toBeVisible();

    await page.getByPlaceholder(/napiši prompt/i).fill("Test streaming message");
    await page.getByRole("button", { name: /^pošlji$/i }).click();

    // Streaming indicator (Pisem... or pulse dots) visible before completion
    await expect(
      page.getByRole("button", { name: /pisem/i }).or(page.locator(".animate-pulse"))
    ).toBeVisible({ timeout: 5000 });

    // Assistant message appears when streaming completes
    await expect(page.getByText(/mock response|agentflow pro/i)).toBeVisible({
      timeout: 15000,
    });
  });

  test("Tourism prompts: select Tourism category and see all 5 prompts", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/chat");
    await expect(page.getByPlaceholder(/napiši prompt/i)).toBeVisible();

    await page.getByRole("button", { name: /select prompt/i }).click();

    // Click Tourism filter (🏨 Tourism)
    await page.getByRole("button", { name: /tourism/i }).click();

    // Assert all 5 tourism prompts visible
    await expect(page.getByText("Booking.com Opis Nastanitve")).toBeVisible();
    await expect(page.getByText("Airbnb Storytelling Opis")).toBeVisible();
    await expect(page.getByText("Vodič po Destinaciji")).toBeVisible();
    await expect(page.getByText("Sezonska Kampanja")).toBeVisible();
    await expect(page.getByText("Instagram Travel Caption")).toBeVisible();
  });

  test("multi-turn: two messages preserve context", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/chat");
    await expect(page.getByPlaceholder(/napiši prompt/i)).toBeVisible();

    // First message
    await page.getByPlaceholder(/napiši prompt/i).fill("What is 2+2?");
    await page.getByRole("button", { name: /^pošlji$/i }).click();
    await expect(page.getByText(/mock response|agentflow pro/i)).toBeVisible({
      timeout: 15000,
    });

    // Second message
    await page.getByPlaceholder(/napiši prompt/i).fill("And multiply by 3?");
    await page.getByRole("button", { name: /^pošlji$/i }).click();
    await expect(page.getByText(/mock response|agentflow pro/i).nth(1)).toBeVisible({
      timeout: 15000,
    });

    // Both user messages visible
    await expect(page.getByText("What is 2+2?", { exact: true })).toBeVisible();
    await expect(
      page.getByText("And multiply by 3?", { exact: true })
    ).toBeVisible();
  });

  test("Copy button on assistant message shows toast", async ({
    page,
    auth: _auth,
  }) => {
    await page.goto("/chat");
    await page.getByPlaceholder(/napiši prompt/i).fill("Short test");
    await page.getByRole("button", { name: /^pošlji$/i }).click();
    await expect(page.getByText(/mock response/i)).toBeVisible({
      timeout: 15000,
    });

    await page.getByRole("button", { name: /kopiraj vsebino/i }).click();
    await expect(page.getByText(/kopirano/i)).toBeVisible();
  });
});
