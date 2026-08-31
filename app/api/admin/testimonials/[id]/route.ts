import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateTestimonialSchema } from '@/lib/validations/admin-testimonial';
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
    const testimonial = await withRetry(() =>
      prisma.testimonial.findUnique({
        where: { id },
        include: { course: { select: { id: true, title: true } } },
      }),
    );
    if (!testimonial) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }
    return NextResponse.json(testimonial);
  } catch (error) {
    console.error('[GET /api/admin/testimonials/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch testimonial' }, { status: 500 });
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
    const parsed = updateTestimonialSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.testimonial.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.testimonial.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'testimonial',
      entityId: id,
      action: 'testimonial_update',
      description: `Updated testimonial from "${updated.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/testimonials/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update testimonial' }, { status: 500 });
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
    const existing = await withRetry(() => prisma.testimonial.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Testimonial not found' }, { status: 404 });
    }

        await withRetry(() => prisma.testimonial.update({ where: { id }, data: { status: 'deleted', deletedAt: new Date() } }));

    await logActivity({
      entity: 'testimonial',
      entityId: id,
      action: 'testimonial_delete',
      description: `Deleted testimonial from "${existing.name}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/testimonials/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete testimonial' }, { status: 500 });
  }
}
