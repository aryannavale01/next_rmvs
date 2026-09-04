import { test, expect, type Page } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SERVER_LOG = resolve(process.cwd(), "dev-e2e-server.log");

function readOtpCode(disposableEmail: string): string {
  if (!existsSync(SERVER_LOG)) {
    throw new Error(`server log not found at ${SERVER_LOG}`);
  }
  const content = readFileSync(SERVER_LOG, "utf8");
  const needle = `EMAIL ${disposableEmail.toLowerCase()}`;
  // Collect all matching lines; take the last one (freshest code).
  const matches = content
    .split("\n")
    .filter((l) => l.includes("[forgot-password:test]") && l.includes(needle));
  if (matches.length === 0) {
    throw new Error(
      `no OTP line found in ${SERVER_LOG} for ${disposableEmail}. ` +
        "Full tail:\n" + content.split("\n").slice(-40).join("\n"),
    );
  }
  const codeMatch = matches[matches.length - 1].match(/CODE\s+(\d{6})/);
  if (!codeMatch) {
    throw new Error("OTP line found but no 6-digit code parsed");
  }
  return codeMatch[1];
}

async function createDisposableMember(): Promise<{ id: string; email: string; password: string }> {
  const { hashPassword } = await import("better-auth/crypto");
  const password = "OldPass_Test@123";
  const email = `pwreset-test-${Date.now()}@example.com`;
  const id = randomUUID();
  const hashed = await hashPassword(password);
  await prisma.$transaction([
    prisma.user.create({
      data: {
        id,
        email,
        name: "Password Reset E2E",
        emailVerified: true,
        role: "MEMBER",
      },
    }),
    prisma.account.create({
      data: {
        id: randomUUID(),
        userId: id,
        accountId: id,
        providerId: "credential",
        password: hashed,
      },
    }),
  ]);
  return { id, email, password };
}

async function cleanupDisposableMember(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } }).catch(() => {});
}

test.describe("Forgot-password chain (full)", () => {
  test("request code -> verify OTP -> reset password -> sign in with new password", async ({ page }) => {
    test.setTimeout(180_000);
    const member = await createDisposableMember();
    const newPassword = "BrandNew_Pass@456";

    try {
      // Step 1: request the reset code
      await page.goto("/forgot-password");
      await page.fill("#reset-email", member.email);
      await page.getByRole("button", { name: /send reset code/i }).click();
      // OTP field appears once the send request completes.
      await expect(page.locator("#reset-code")).toBeVisible({ timeout: 30_000 });

      // Step 2: read the emailed code from the server log and verify it
      const code = readOtpCode(member.email);
      expect(code).toMatch(/^\d{6}$/);
      await page.fill("#reset-code", code);
      await page.getByRole("button", { name: /verify code/i }).click();
      await expect(page.locator("#new-password")).toBeVisible({ timeout: 30_000 });

      // Step 3: set the new password
      await page.fill("#new-password", newPassword);
      await page.fill("#confirm-password", newPassword);
      await page.getByRole("button", { name: /reset password/i }).click();
      await expect(page.getByRole("heading", { name: "Password changed!" })).toBeVisible({ timeout: 30_000 });

      // Step 4: sign in with the NEW password to prove the reset took effect.
      await page.goto("/login");
      await page.fill("#email", member.email);
      await page.fill("#password", newPassword);
      await page.getByRole("button", { name: /sign in/i }).click();
      await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 30_000 });
    } finally {
      await cleanupDisposableMember(member.id);
      await prisma.$disconnect();
    }
  });

  test("badly typed OTP is rejected before it can reset the password", async ({ page }) => {
    test.setTimeout(180_000);
    const member = await createDisposableMember();
    try {
      await page.goto("/forgot-password");
      await page.fill("#reset-email", member.email);
      await page.getByRole("button", { name: /send reset code/i }).click();
      await expect(page.locator("#reset-code")).toBeVisible({ timeout: 30_000 });

      const code = readOtpCode(member.email);
      const wrong = code === "000000" ? "111111" : "000000";
      await page.fill("#reset-code", wrong);
      await page.getByRole("button", { name: /verify code/i }).click();
      // An invalid code must keep us on the OTP step with an error, not advance.
      await expect(page.getByRole("alert")).toBeVisible({ timeout: 30_000 });
      await expect(page.locator("#reset-code")).toBeVisible();
      await expect(page.locator("#new-password")).not.toBeVisible();
    } finally {
      await cleanupDisposableMember(member.id);
      await prisma.$disconnect();
    }
  });
});
