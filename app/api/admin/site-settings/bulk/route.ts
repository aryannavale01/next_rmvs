import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { requireStepUp, stepUpErrorResponse } from '@/lib/session';
import { prisma, withRetry, isTransientPrismaError } from '@/lib/prisma';
import { logActivity } from '@/lib/activity-log';
import { invalidateOrgConfig } from '@/lib/org-config';
import { isAllowedSettingKey, getSettingCategory } from '@/lib/site-setting-keys';
import { isValidBrandColor } from '@/lib/brand-color';

export const dynamic = 'force-dynamic';

const settingEntrySchema = z
  .object({
    key: z.string().max(200),
    value: z.string().max(10000),
    label: z.string().max(200),
    category: z.string().max(50),
  })
  .refine((s) => isAllowedSettingKey(s.key), { message: 'Unknown setting key' })
  .refine((s) => getSettingCategory(s.key) === s.category, { message: 'Category does not match key' })
  .superRefine((s, ctx) => {
    if (s.key === 'appearance.brandColor' && !isValidBrandColor(s.value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Brand color must be a valid hex color like #2563EB',
      });
    }
  });

const bulkSchema = z.object({
  settings: z.array(settingEntrySchema).max(200),
});

export async function POST(request: NextRequest) {
  const auth = await requireStepUp();
  if (!auth.success) {
    return stepUpErrorResponse(auth)!;
  }

  try {
    const body = await request.json();
    const parsed = bulkSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid settings payload', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const results = await withRetry(() =>
      prisma.$transaction(
        parsed.data.settings
          // An empty SMTP password means "keep the current one" — the real
          // value is never sent to the browser, so a blank submit preserves it.
          .filter(
            (s) => !(s.key === 'email.smtpPass' && s.value.trim() === ''),
          )
          .map((s) =>
            prisma.siteSetting.upsert({
              where: { key: s.key },
              create: { key: s.key, value: s.value, label: s.label, category: s.category },
              update: { value: s.value, label: s.label, category: s.category },
            }),
          ),
      ),
    );

    await logActivity({
      entity: 'site_setting',
      entityId: 'bulk',
      action: 'site_setting_upsert',
      description: `Bulk upserted ${results.length} site settings`,
      performedBy: auth.session.user.id,
    });

    invalidateOrgConfig();

    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error('[POST /api/admin/site-settings/bulk]', error);
    if (isTransientPrismaError(error)) {
      return NextResponse.json({ error: 'Database temporarily unavailable, please retry.' }, { status: 503 });
    }
    return NextResponse.json({ error: 'Failed to bulk upsert site settings' }, { status: 500 });
  }
}
