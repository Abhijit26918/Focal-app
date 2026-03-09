import { test, expect } from "@playwright/test";

// These tests require a logged-in session.
// Run with: CLERK_TEST_USER_EMAIL=... CLERK_TEST_USER_PASSWORD=... npx playwright test
// Or set up a storageState file after manual sign-in.

test.describe("Dashboard (authenticated)", () => {
  // Skip if no test credentials provided
  test.skip(
    !process.env.CLERK_TEST_USER_EMAIL || !process.env.CLERK_TEST_USER_PASSWORD,
    "Set CLERK_TEST_USER_EMAIL and CLERK_TEST_USER_PASSWORD to run authenticated tests"
  );

  test.beforeEach(async ({ page }) => {
    // Sign in before each test
    await page.goto("/sign-in");
    await page.getByLabel(/email/i).fill(process.env.CLERK_TEST_USER_EMAIL!);
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByLabel(/password/i).fill(process.env.CLERK_TEST_USER_PASSWORD!);
    await page.getByRole("button", { name: /sign in|continue/i }).click();
    await page.waitForURL("/dashboard", { timeout: 15000 });
  });

  test("dashboard loads with task list", async ({ page }) => {
    await expect(page).toHaveURL("/dashboard");
    // Sidebar should be visible
    await expect(page.getByText(/all tasks/i)).toBeVisible();
  });

  test("can open create task dialog via button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add task|new task/i }).first();
    await addButton.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByLabel(/title/i)).toBeVisible();
  });

  test("command palette opens with Ctrl+K", async ({ page }) => {
    await page.keyboard.press("Control+k");
    await expect(page.getByPlaceholder(/search|type a command/i)).toBeVisible({ timeout: 3000 });
  });

  test("can navigate to analytics page", async ({ page }) => {
    await page.getByRole("link", { name: /analytics/i }).click();
    await expect(page).toHaveURL("/analytics");
    await expect(page.getByText(/completion trend|tasks completed/i)).toBeVisible();
  });

  test("can navigate to habits page", async ({ page }) => {
    await page.getByRole("link", { name: /habits/i }).click();
    await expect(page).toHaveURL("/habits");
  });
});
