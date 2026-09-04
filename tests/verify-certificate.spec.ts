import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { PrismaClient, type CertificateStatus, type PublishedStatus } from "@prisma/client";

const prisma = new PrismaClient();

const CODE_VERIFIED = "VRTEST-VERIFIED-0001";
const CODE_REVOKED = "VRTEST-REVOKED-0001";
const CODE_PENDING = "VRTEST-PENDING-0001";

async function createDisposableMember(): Promise<{ id: string; email: string }> {
  const { hashPassword } = await import("better-auth/crypto");
  const id = randomUUID();
  const email = `verify-test-${Date.now()}@example.com`;
  const hashed = await hashPassword("Verify_T@st123");
  await prisma.$transaction([
    prisma.user.create({
      data: { id, email, name: "Verify E2E Member", emailVerified: true, role: "MEMBER" },
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
    prisma.profile.create({
      data: { id, fullName: "Verify E2E Member", email, role: "member" },
    }),
  ]);
  return { id, email };
}

async function seedCertificate(
  profileId: string,
  code: string,
  opts: { status: CertificateStatus; publishedStatus: PublishedStatus; revokedReason?: string },
) {
  return prisma.certificate.create({
    data: {
      certificateNumber: `CERT-${code}`,
      profileId,
      memberName: "Verify E2E Member",
      courseName: "Digital Skills & Employability",
      batch: "E2E-2026",
      teacherName: "E2E Trainer",
      issueDate: new Date("2026-06-01T00:00:00Z"),
      completionDate: new Date("2026-06-15T00:00:00Z"),
      status: opts.status,
      publishedStatus: opts.publishedStatus,
      verificationCode: code,
      verificationUrl: `http://localhost:3000/verify/${code}`,
      revokedAt: opts.status === "revoked" ? new Date("2026-07-01T00:00:00Z") : null,
      revokedReason: opts.revokedReason ?? null,
    },
  });
}

async function cleanup(memberId: string): Promise<void> {
  await prisma.certificate
    .deleteMany({ where: { profileId: memberId } })
    .catch(() => {});
  await prisma.user.delete({ where: { id: memberId } }).catch(() => {});
}

test.describe("Public certificate verification", () => {
  let memberId = "";

  test.beforeAll(async () => {
    const member = await createDisposableMember();
    memberId = member.id;
    // Clean any leftover rows from interrupted runs (codes are fixed constants).
    await prisma.certificate.deleteMany({
      where: { verificationCode: { in: [CODE_VERIFIED, CODE_REVOKED, CODE_PENDING] } },
    }).catch(() => {});
    await seedCertificate(memberId, CODE_VERIFIED, {
      status: "approved",
      publishedStatus: "published",
    });
    await seedCertificate(memberId, CODE_REVOKED, {
      status: "revoked",
      publishedStatus: "published",
      revokedReason: "Issued in error by the training coordinator.",
    });
    await seedCertificate(memberId, CODE_PENDING, {
      status: "generated",
      publishedStatus: "pending",
    });
  });

  test.afterAll(async () => {
    await cleanup(memberId);
    await prisma.$disconnect();
  });

  test("landing page renders and links work", async ({ page }) => {
    await page.goto("/verify");
    await expect(
      page.getByRole("heading", { name: /Verify a Certificate Instantly/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /verification code or url/i }),
    ).toBeVisible();
  });

  test("verified certificate shows Verified status", async ({ page }) => {
    await page.goto(`/verify/${CODE_VERIFIED}`);
    await expect(page.getByText("Certificate Verified")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(CODE_VERIFIED, { exact: true })).toBeVisible();
    await expect(page.getByText("Digital Skills & Employability")).toBeVisible();
    await expect(page.getByText("Verify E2E Member").first()).toBeVisible();
  });

  test("revoked certificate shows Revoked status and reason", async ({ page }) => {
    await page.goto(`/verify/${CODE_REVOKED}`);
    await expect(page.getByText("Certificate Revoked")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Issued in error by the training coordinator\./)).toBeVisible();
  });

  test("unpublished certificate shows Pending status", async ({ page }) => {
    await page.goto(`/verify/${CODE_PENDING}`);
    await expect(page.getByText("Certificate Pending")).toBeVisible({ timeout: 30_000 });
  });

  test("unknown code renders the not-found page", async ({ page }) => {
    // notFound() reliably returns a 404 status in production builds; in Next.js
    // dev mode it can resolve to a 200 while still serving the 404 UI, so we
    // assert on the rendered boundary (works in both environments).
    await page.goto("/verify/NOT-A-REAL-CODE-9999");
    await expect(page.getByRole("heading", { name: "404" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Page not found")).toBeVisible();
    await expect(page).toHaveURL(/\/verify\/NOT-A-REAL-CODE-9999/);
  });

  test("lookup form navigates to the result page", async ({ page }) => {
    await page.goto("/verify");
    await page
      .getByRole("textbox", { name: /verification code or url/i })
      .fill(CODE_VERIFIED);
    await page.getByRole("button", { name: /verify now/i }).click();
    await expect(page.getByText("Certificate Verified")).toBeVisible({ timeout: 30_000 });
  });
});
