import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateMilestoneSchema } from '@/lib/validations/admin-milestone';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const milestone = await withRetry(() => prisma.milestone.findUnique({ where: { id } }));
    if (!milestone) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }
    return NextResponse.json(milestone);
  } catch (error) {
    console.error('[GET /api/admin/milestones/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch milestone' }, { status: 500 });
  }
}

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
    const parsed = updateMilestoneSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.milestone.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.milestone.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'milestone',
      entityId: id,
      action: 'milestone_update',
      description: `Updated milestone "${updated.title}" (${updated.year})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/milestones/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update milestone' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const { id } = await params;
    const existing = await withRetry(() => prisma.milestone.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Milestone not found' }, { status: 404 });
    }

    await withRetry(() => prisma.milestone.update({ where: { id }, data: { status: 'deleted', deletedAt: new Date() } }));

    await logActivity({
      entity: 'milestone',
      entityId: id,
      action: 'milestone_delete',
      description: `Deleted milestone "${existing.title}" (${existing.year})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/milestones/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete milestone' }, { status: 500 });
  }
}
