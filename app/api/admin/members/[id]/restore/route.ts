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

    const existing = await prisma.profile.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    if (existing.status !== 'deleted') {
      return NextResponse.json(
        { error: 'Member is not deleted' },
        { status: 400 },
      );
    }

    const updated = await prisma.profile.update({
      where: { id },
      data: { status: 'active' },
    });

    await logActivity({
      entity: 'member',
      entityId: id,
      action: 'restore',
      description: `Restored member ${existing.fullName} (${existing.email})`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({
      message: 'Member restored',
      id: updated.id,
      status: updated.status,
    });
  } catch (error) {
    console.error('[PATCH /api/admin/members/[id]/restore]', error);
    return NextResponse.json(
      { error: 'Failed to restore member' },
      { status: 500 },
    );
  }
}
