import { NextRequest, NextResponse } from 'next/server';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, dbErrorResponse } from '@/lib/prisma';
import { updateMemberStatusSchema } from '@/lib/validations/admin-member';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const parsed = updateMemberStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { status, reason } = parsed.data;

    const existing = await withRetry(() => prisma.profile.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (existing.status === status) {
      return NextResponse.json(
        { error: `Member is already ${status}` },
        { status: 400 },
      );
    }

    const previousStatus = existing.status;
    const updated = await withRetry(() =>
      prisma.profile.update({
        where: { id },
        data: { status },
      })
    );

    const reasonText = reason ? ` Reason: ${reason}` : '';
    await logActivity({
      entity: 'member',
      entityId: id,
      action: 'status_change',
      description: `Changed ${existing.fullName} status from ${previousStatus} to ${status}.${reasonText}`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      id: updated.id,
      previousStatus,
      newStatus: updated.status,
    });
  } catch (error) {
    const dbResp = dbErrorResponse(error);
    if (dbResp) return dbResp;
    console.error('[PATCH /api/admin/members/[id]/status]', error);
    return NextResponse.json(
      { error: 'Failed to update member status' },
      { status: 500 },
    );
  }
}
