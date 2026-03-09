import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("landing page loads and shows sign-in link", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Focal/i);
    // Should have a sign-in or get started link
    const signInLink = page.getByRole("link", { name: /sign in|get started|log in/i }).first();
    await expect(signInLink).toBeVisible();
  });

  test("redirects unauthenticated user from /dashboard to sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-in page loads correctly", async ({ page }) => {
    await page.goto("/sign-in");
    // Clerk renders an email input
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
  });

  test("sign-up page loads correctly", async ({ page }) => {
    await page.goto("/sign-up");
    await expect(page.getByLabel(/email/i)).toBeVisible({ timeout: 10000 });
  });
});
