import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateProgramSchema } from '@/lib/validations/admin-program';
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
    const program = await withRetry(() => prisma.program.findUnique({ where: { id } }));
    if (!program) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }
    return NextResponse.json(program);
  } catch (error) {
    console.error('[GET /api/admin/programs/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch program' }, { status: 500 });
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
    const parsed = updateProgramSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.program.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.program.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'program',
      entityId: id,
      action: 'program_update',
      description: `Updated program "${updated.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/programs/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update program' }, { status: 500 });
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
    const existing = await withRetry(() => prisma.program.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Program not found' }, { status: 404 });
    }

      await withRetry(() => prisma.program.update({ where: { id }, data: { status: 'deleted', deletedAt: new Date() } }));

    await logActivity({
      entity: 'program',
      entityId: id,
      action: 'program_delete',
      description: `Deleted program "${existing.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/programs/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete program' }, { status: 500 });
  }
}
