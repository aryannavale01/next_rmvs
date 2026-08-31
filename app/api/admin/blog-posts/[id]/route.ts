import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { updateBlogPostSchema } from '@/lib/validations/admin-blog-post';
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
    const post = await withRetry(() => prisma.blogPost.findUnique({ where: { id } }));
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }
    return NextResponse.json(post);
  } catch (error) {
    console.error('[GET /api/admin/blog-posts/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to fetch blog post' }, { status: 500 });
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
    const parsed = updateBlogPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await withRetry(() => prisma.blogPost.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    const updated = await withRetry(() => prisma.blogPost.update({ where: { id }, data: parsed.data }));

    await logActivity({
      entity: 'blog_post',
      entityId: id,
      action: 'blog_post_update',
      description: `Updated blog post "${updated.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[PATCH /api/admin/blog-posts/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to update blog post' }, { status: 500 });
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
    const existing = await withRetry(() => prisma.blogPost.findUnique({ where: { id } }));
    if (!existing) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    await withRetry(() => prisma.blogPost.update({ where: { id }, data: { status: 'deleted' } }));

    await logActivity({
      entity: 'blog_post',
      entityId: id,
      action: 'blog_post_delete',
      description: `Soft-deleted blog post "${existing.title}"`,
      performedBy: auth.session.user.id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[DELETE /api/admin/blog-posts/[id]]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to delete blog post' }, { status: 500 });
  }
}
