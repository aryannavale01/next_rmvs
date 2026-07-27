import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { prisma } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';

export const dynamic = 'force-dynamic';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.teacher.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    if (existing.status === 'deleted') {
      return NextResponse.json(
        { error: 'Teacher is already deleted' },
        { status: 400 },
      );
    }

    const updated = await prisma.teacher.update({
      where: { id },
      data: { status: 'deleted' },
    });

    await logActivity({
      entity: 'teacher',
      entityId: id,
      action: 'delete',
      description: `Soft-deleted teacher ${existing.fullName} (${existing.email})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'Teacher soft-deleted',
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/teachers/[id]/delete]', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher' },
      { status: 500 },
    );
  }
}
