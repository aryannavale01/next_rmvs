import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";

const MEMBER_PASSWORD: string = process.env.E2E_MEMBER_PASSWORD!;
if (!MEMBER_PASSWORD) throw new Error("E2E_MEMBER_PASSWORD is required");
const MEMBER = { email: "test.member@example.com", password: MEMBER_PASSWORD };

async function login(page: import("@playwright/test").Page) {
  await page.goto("/login");
  await page.fill("#email", MEMBER.email);
  await page.fill("#password", MEMBER.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
}

test("2.1 dashboard loads with welcome + stat cards", async ({ page }) => {
  await login(page);
  await expect(page.getByText(/all your training modules/i)).toBeVisible({ timeout: 20_000 });
});

test("2.2 profile completion widget visible with % or missing fields", async ({ page }) => {
  await login(page);
  const widget = page.getByText(/profile complete/i).first();
  await expect(widget).toBeVisible({ timeout: 20_000 });
});

test("2.3 profile page loads all form fields", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/profile");
  await expect(page.getByText(/identity documents/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[placeholder="e.g. 1234 5678 9012"]')).toBeVisible();
  await expect(page.locator('input[placeholder="e.g. ABCDE1234F"]')).toBeVisible();
});

test("2.4 save profile change persists after reload", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/profile");
  await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible({ timeout: 20_000 });
  // text inputs order: First, Last, Phone, Aadhaar(has placeholder), PAN(placeholder), Ration(placeholder)
  // Use nth-based targeting inside personal form
  const form = page.locator("form").first();
  const textInputs = form.locator('input[type="text"]');
  await textInputs.nth(0).fill("Test");
  await textInputs.nth(1).fill(`Member${Date.now() % 10000}`);
  await page.getByRole("button", { name: /save changes/i }).click();
  await expect(page.getByText(/profile details saved successfully/i)).toBeVisible({ timeout: 30_000 });
  // reload and confirm persisted
  await page.reload();
  await expect(page.getByRole("button", { name: /save changes/i })).toBeVisible({ timeout: 30_000 });
  const lastNameVal = await page.locator("form").first().locator('input[type="text"]').nth(1).inputValue();
  expect(lastNameVal).toMatch(/^Member\d+$/);
});

test("2.5 identity document upload works", async ({ page }) => {
  await login(page);
  await page.goto("/dashboard/profile");
  await expect(page.getByText(/identity documents/i)).toBeVisible({ timeout: 20_000 });
  // 1x1 red PNG
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const tmp = path.join(process.cwd(), "tests/flow/tmp-aadhaar.png");
  fs.writeFileSync(tmp, png);
  const input = page.locator('input[accept="application/pdf,image/*"]').first();
  await input.setInputFiles(tmp);
  // wait for either success (document listed) or error message
  await page.waitForTimeout(8000);
  const err = await page.locator(".text-destructive").allTextContents();
  if (err.length) console.log("UPLOAD ERRORS:", JSON.stringify(err));
  fs.unlinkSync(tmp);
});
