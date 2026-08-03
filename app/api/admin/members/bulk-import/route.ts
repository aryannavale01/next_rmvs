import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, authErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { createMemberSchema } from '@/lib/validations/admin-member';
import { logActivity } from '@/lib/activity-log';
import { hashPassword } from '@better-auth/utils/password';
import * as crypto from 'node:crypto';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BulkImportSchema = z.object({
  rows: z.array(createMemberSchema).min(1, 'At least one row is required').max(200, 'Maximum 200 rows per import'),
});

type RowResult = {
  row: number;
  success: boolean;
  id?: string;
  email?: string;
  error?: string;
  temporaryPassword?: string;
};

function generateTempPassword(): string {
  const rawBytes = crypto.randomBytes(20).toString('base64url');
  const specialChars = '!@#$%^&*';
  return (
    rawBytes.charAt(0).toUpperCase() +
    rawBytes.slice(1, 10) +
    crypto.randomInt(10).toString() +
    rawBytes.slice(10, 18) +
    specialChars[crypto.randomInt(specialChars.length)] +
    rawBytes.slice(18)
  );
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return authErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const parsed = BulkImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const rows = parsed.data.rows;

    // Pre-check: collect all emails and find which ones already exist
    const emails = rows.map(r => r.email);
    const existingUsers = await withRetry(() =>
      prisma.$queryRawUnsafe<{ email: string }[]>(
        'SELECT email FROM "User" WHERE email IN (' + emails.map((_, i) => `$${i + 1}`).join(',') + ')',
        ...emails,
      ),
    );
    const existingEmails = new Set(existingUsers.map(u => u.email));

    const results: RowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const data = rows[i];

      // Skip if email already exists
      if (existingEmails.has(data.email)) {
        results.push({ row: i + 1, success: false, email: data.email, error: 'A user with this email already exists' });
        continue;
      }

      try {
        const temporaryPassword = generateTempPassword();
        const hashedPw = await hashPassword(temporaryPassword);
        const userId = crypto.randomBytes(16).toString('hex');
        const now = new Date();

        const profile = await withRetry(() =>
          prisma.$transaction(async (tx) => {
          await tx.$executeRawUnsafe(
            'INSERT INTO "User" (id, email, "emailVerified", name, role, "mustChangePassword", "lastLoginAt", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8, $9)',
            userId,
            data.email,
            true,
            data.fullName,
            'MEMBER',
            true,
            now,
            now,
            now,
          );

          await tx.$executeRawUnsafe(
            'INSERT INTO "Account" (id, "userId", "accountId", "providerId", password, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, $7)',
            crypto.randomBytes(16).toString('hex'),
            userId,
            crypto.randomBytes(12).toString('hex'),
            'credential',
            hashedPw,
            now,
            now,
          );

          const prof = await tx.profile.create({
            data: {
              id: userId,
              fullName: data.fullName,
              email: data.email,
              phone: data.phone ?? null,
              gender: data.gender ?? null,
              dob: data.dob ?? null,
              role: 'member',
              aadhaarNumber: data.aadhaarNumber?.replace(/-/g, '') ?? null,
              panNumber: data.panNumber?.toUpperCase() ?? null,
              addressLine1: data.addressLine1 ?? null,
              district: data.district ?? null,
              state: data.state ?? null,
              pincode: data.pincode ?? null,
              qualification: data.qualification ?? null,
              status: data.status ?? 'active',
              assignedVolunteer: data.assignedVolunteer ?? null,
              fieldOfficer: data.fieldOfficer ?? null,
              coordinator: data.coordinator ?? null,
              region: data.region ?? null,
            },
          });

          if (data.beneficiaryDetail) {
            await tx.beneficiaryDetail.create({
              data: { profileId: userId, ...data.beneficiaryDetail },
            });
          }

          if (data.beneficiaryAddresses && data.beneficiaryAddresses.length > 0) {
            await tx.beneficiaryAddress.createMany({
              data: data.beneficiaryAddresses.map((addr) => ({ profileId: userId, ...addr })),
            });
          }

          return prof;
        })
        );

        results.push({ row: i + 1, success: true, id: profile.id, email: data.email, temporaryPassword });
      } catch (err: any) {
        results.push({ row: i + 1, success: false, email: data.email, error: err.message ?? 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Single activity log entry for the batch
    await logActivity({
      entity: 'member',
      action: 'create',
      description: `Bulk imported ${successCount}/${rows.length} members via CSV${failureCount > 0 ? ` (${failureCount} failed)` : ''}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ results, successCount, failureCount });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[POST /api/admin/members/bulk-import]', error);
    return NextResponse.json(
      { error: 'Failed to process bulk import' },
      { status: 500 },
    );
  }
}
