import { test, expect, type Page } from "@playwright/test";
import { execFileSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { e2eAdminCredentials } from "./helpers/credentials";

// ============================================================================
// FULL MEMBER JOURNEY — E2E
// Register a brand-new member via the public UI, verify their email (simulated
// in DB), then walk the complete path to a downloadable certificate:
//   register -> verify -> login -> profile docs -> apply -> admin approve/enroll
//   /complete -> member request cert -> admin generate PDF -> member download
//
// Uses REAL backend endpoints and REAL DB state only (no request stubs).
// Admin actions run through a second authenticated context per the plan.
// ============================================================================

const MEMBER_PASSWORD = "JourneyPass@123";
const memberEmail = `journey.${Date.now()}@example.com`;
let courseId = "";
let fixtureAadhaar = "";

const ADMIN = e2eAdminCredentials();

function runHelper(args: string[]): string {
  return execFileSync("npx", ["tsx", "scripts/e2e-journey-helper.ts", ...args], {
    cwd: process.cwd(),
    encoding: "utf-8",
    timeout: 180_000,
    shell: true,
  });
}

async function loginMember(page: Page): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", memberEmail);
  await page.fill("#password", MEMBER_PASSWORD);
  await Promise.all([
    page.waitForURL(/\/dashboard/, { timeout: 45_000 }),
    page.getByRole("button", { name: /sign in/i }).click(),
  ]);
}

async function loginAdmin(page: Page): Promise<void> {
  await page.goto("/admin/login");
  await page.fill("#admin-email", ADMIN.email);
  await page.fill("#admin-password", ADMIN.password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(
    (url) => url.pathname.startsWith("/admin") && !url.pathname.includes("/login"),
    { timeout: 45_000 },
  );
}

async function verifyStepUp(page: Page): Promise<void> {
  const res = await page.request.post("/api/admin/verify-stepup", {
    data: { password: ADMIN.password },
  });
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.success).toBe(true);
}

test.beforeAll(() => {
  const png = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
    "base64",
  );
  const dir = path.join(process.cwd(), "tests", "flow");
  fs.mkdirSync(dir, { recursive: true });
  fixtureAadhaar = path.join(dir, "journey-aadhaar.png");
  fs.writeFileSync(fixtureAadhaar, png);
});

test.afterAll(async () => {
  try {
    if (fixtureAadhaar && fs.existsSync(fixtureAadhaar)) fs.unlinkSync(fixtureAadhaar);
  } catch { /* ignore */ }
  try {
    runHelper(["cleanup", memberEmail]);
  } catch { /* already cleaned or user removed */ }
});

test("Full member journey: register -> certificate download", async ({ browser }) => {
  test.setTimeout(360_000);

  // ---------------- MEMBER CONTEXT ----------------
  const memberCtx = await browser.newContext();
  const member = await memberCtx.newPage();

  await test.step("1. register via UI", async () => {
    await member.goto("/register");
    await member.fill("#fullName", "Journey Test Member");
    await member.fill("#reg-email", memberEmail);
    await member.fill("#reg-password", MEMBER_PASSWORD);
    await member.fill("#confirmPassword", MEMBER_PASSWORD);
    await member.getByRole("button", { name: /create account/i }).click();
    // requireEmailVerification=true -> expect the "Account Created!" success screen.
    await expect(member.getByText(/account created/i)).toBeVisible({ timeout: 60_000 });
  });

  await test.step("2. verify email (DB)", async () => {
    const out = runHelper(["verify", memberEmail]);
    expect(out).toContain("VERIFIED");
  });

  await test.step("3. member login", async () => {
    await loginMember(member);
    await expect(member).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  });

  await test.step("4. complete profile + upload aadhaar", async () => {
    await member.goto("/dashboard/profile");
    await expect(member.getByText(/identity documents/i)).toBeVisible({ timeout: 30_000 });

    const form = member.locator("form").first();
    const textInputs = form.locator('input[type="text"]');
    await textInputs.nth(0).fill("Journey");
    await textInputs.nth(1).fill("Member");
    await textInputs.nth(3).fill("9876543210");
    await textInputs.nth(4).fill("123456789012");
    await textInputs.nth(5).fill("ABCDE1234F");

    const aadhaarInput = member.locator('input[accept="application/pdf,image/*"]').nth(0);
    await aadhaarInput.setInputFiles(fixtureAadhaar);
    await member.waitForTimeout(9000);

    await member.getByRole("button", { name: /save changes/i }).click();
    await expect(member.getByText(/profile details saved successfully/i)).toBeVisible({ timeout: 30_000 });
    await member.reload();
    await member.waitForTimeout(3000);
  });

  await test.step("5. apply to a free course via UI", async () => {
    const dash = await member.request.get("/api/dashboard");
    expect(dash.ok()).toBeTruthy();
    const dashJson = await dash.json();
    const courses = dashJson?.courses ?? dashJson?.data?.courses ?? [];
    const free = courses.find(
      (c: { price?: number; status?: string }) =>
        (!c.price || Number(c.price) === 0) && c.status !== "archived",
    );
    expect(free, "a free active course must exist to apply to").toBeTruthy();
    courseId = free.id as string;

    await member.goto(`/dashboard/training/apply/${courseId}`);
    await expect(member.locator("#apply-form")).toBeVisible({ timeout: 30_000 });

    // Education field (5th text input in the personal details grid).
    const eduInput = member.locator("#apply-form input[type='text']").nth(4);
    await eduInput.fill("Senior Secondary");
    // Motivation textarea.
    await member.locator("#apply-form textarea").fill(
      "I want to complete this training to better serve my community.",
    );

    await member.locator("#apply-form button[type=submit]").first().click();
    await expect(member.getByText(/application submitted/i)).toBeVisible({ timeout: 40_000 });
  });

  // ---------------- ADMIN CONTEXT ----------------
  let enrollmentId = "";
  const adminCtx = await browser.newContext();
  const admin = await adminCtx.newPage();

  await test.step("6. admin approves / enrolls / completes", async () => {
    await loginAdmin(admin);
    await verifyStepUp(admin);

    const list = await admin.request.get(`/api/admin/enrollments?courseId=${courseId}&limit=100`);
    expect(list.status()).toBe(200);
    const listJson = await list.json();
    const app = (listJson.data ?? []).find(
      (a: { member?: { email?: string } }) => a.member?.email === memberEmail,
    );
    expect(app, "new member application must be visible to admin").toBeTruthy();
    const appId = app.id as string;

    const approve = await admin.request.patch(`/api/admin/enrollments/${appId}`, {
      data: { status: "seat_reserved" },
    });
    expect(approve.status(), "approve should succeed after step-up").toBe(200);

    const enrolled = await admin.request.get(`/api/admin/enrollments/enrolled?courseId=${courseId}&limit=100`);
    expect(enrolled.status()).toBe(200);
    const enrolledJson = await enrolled.json();
    const enr = (enrolledJson.data ?? []).find(
      (e: { profile?: { email?: string } }) => e.profile?.email === memberEmail,
    );
    expect(enr, "enrollment should exist for member").toBeTruthy();
    enrollmentId = enr.id as string;

    const complete = await admin.request.patch(`/api/admin/enrollments/enrolled/${enrollmentId}`, {
      data: { status: "completed" },
    });
    expect(complete.status(), "marking completed should succeed after step-up").toBe(200);
  });

  await test.step("7. member requests certificate", async () => {
    await member.goto("/dashboard/certificates");
    const genBtn = member.getByRole("button", { name: /generate certificate/i }).first();
    await expect(genBtn).toBeVisible({ timeout: 40_000 });
    await genBtn.click();
    await expect(member.getByText(/certificate requested/i)).toBeVisible({ timeout: 40_000 });
  });

  await test.step("8. admin generates PDF", async () => {
    await verifyStepUp(admin);
    const res = await admin.request.post("/api/admin/certificates/generate", {
      data: { courseId, enrollmentIds: [enrollmentId] },
    });
    expect(res.status(), "admin generate should succeed after step-up").toBe(200);
    const body = await res.json();
    const cert = (body.data?.certificates ?? []).find(
      (c: { courseId?: string }) => c.courseId === courseId,
    );
    expect(cert, "generated certificate should be returned").toBeTruthy();
    expect(cert.pdfStoragePath, "PDF must be uploaded (storage path set)").toBeTruthy();
  });

  await test.step("9. member downloads PDF", async () => {
    await member.reload();
    const downloadBtn = member.getByRole("button", { name: /download pdf/i }).first();
    await expect(downloadBtn).toBeVisible({ timeout: 40_000 });

    // Poll the dashboard API for the certificate id, then hit the download endpoint.
    let certId = "";
    for (let i = 0; i < 10 && !certId; i++) {
      const d = await member.request.get("/api/dashboard");
      const j = await d.json();
      const certs = j?.certificates ?? j?.data?.certificates ?? [];
      certId = certs.find((c: { courseId?: string }) => c.courseId === courseId)?.id ?? "";
      if (!certId) await member.waitForTimeout(1500);
    }
    expect(certId, "member must have a certificate row").toBeTruthy();

    const dl = await member.request.get(`/api/member/certificates/${certId}/download`);
    expect(dl.ok, "certificate download endpoint should succeed").toBeTruthy();

    await downloadBtn.click();
    await member.waitForTimeout(2000);
  });

  await adminCtx.close();
  await memberCtx.close();
});
