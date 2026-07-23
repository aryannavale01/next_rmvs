import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/session';
import { prisma } from '@/lib/prisma';

function toRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return '1 day ago';
  if (diffDay < 7) return `${diffDay} days ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} week${diffWeek > 1 ? 's' : ''} ago`;
  return `${Math.floor(diffDay / 30)} month${Math.floor(diffDay / 30) > 1 ? 's' : ''} ago`;
}

function toNotificationGroup(date: Date): 'Today' | 'Yesterday' | 'Earlier' {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  if (date >= startOfToday) return 'Today';
  if (date >= startOfYesterday) return 'Yesterday';
  return 'Earlier';
}

function toActivityGroup(date: Date): 'All' | 'Today' | 'This Week' | 'This Month' {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (date >= startOfToday) return 'Today';
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  if (date >= startOfWeek) return 'This Week';
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  if (date >= startOfMonth) return 'This Month';
  return 'All';
}

const APPLICATION_STATUS_MAP: Record<string, string> = {
  pending: 'Documents Under Verification',
  under_review: 'Under Review',
  approved: 'Approved',
  completed: 'Course Completed',
  rejected: 'Under Review',
};

const CERTIFICATE_STATUS_MAP: Record<string, 'pending' | 'accepted' | 'generated'> = {
  pending: 'pending',
  approved: 'accepted',
  generated: 'generated',
  published: 'generated',
  downloaded: 'generated',
  revoked: 'pending',
};

const NOTIFICATION_TYPE_MAP: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
};

const ACTIVITY_TYPE_MAP: Record<string, 'enrollment' | 'document' | 'coupon' | 'certificate' | 'profile'> = {
  enrollment: 'enrollment',
  document: 'document',
  coupon: 'coupon',
  certificate: 'certificate',
  profile: 'profile',
};

export async function GET(request: Request) {
  const auth = await requireAuth(new Headers(request.headers));
  if (!auth.success) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = auth.session.user.id;

  try {
    const [rawApplications, rawCertificates, rawNotifications, rawActivities] = await Promise.all([
      prisma.courseApplication.findMany({
        where: { profileId: userId },
        include: { course: { select: { title: true } } },
        orderBy: { appliedDate: 'desc' },
        take: 50,
      }),
      prisma.certificate.findMany({
        where: { profileId: userId },
        include: { course: { select: { title: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.findMany({
        where: { profileId: userId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
      prisma.activity.findMany({
        where: { profileId: userId },
        orderBy: { timestamp: 'desc' },
        take: 50,
      }),
    ]);

    const applications = rawApplications.map((app) => {
      const date = new Date(app.appliedDate);
      const docs = (app.documents as Record<string, { name: string; date: string }> | null) || {};
      return {
        id: app.id,
        courseId: app.courseId,
        courseTitle: app.course?.title ?? 'Deleted Course',
        appliedDate: date.toISOString().split('T')[0],
        status: APPLICATION_STATUS_MAP[app.status] ?? 'Under Review',
        couponApplied: app.couponApplied ? 'Applied' : undefined,
        discountAmount: undefined,
        finalPrice: app.amountDue != null ? Number(app.amountDue) : undefined,
        documents: {
          aadhaar: docs.aadhaar ?? undefined,
          pan: docs.pan ?? undefined,
          rationCard: docs.rationCard ?? undefined,
        },
      };
    });

    const certificates = rawCertificates.map((cert) => ({
      id: cert.id,
      courseId: cert.courseId ?? '',
      courseTitle: cert.course?.title ?? 'Deleted Course',
      certificateNo: cert.certificateNumber,
      completionDate: cert.completionDate
        ? cert.completionDate.toISOString().split('T')[0]
        : cert.issueDate
          ? cert.issueDate.toISOString().split('T')[0]
          : '',
      status: CERTIFICATE_STATUS_MAP[cert.status] ?? 'pending',
    }));

    const notifications = rawNotifications.map((n) => {
      const date = new Date(n.timestamp);
      return {
        id: n.id,
        title: n.title,
        description: n.description ?? '',
        type: NOTIFICATION_TYPE_MAP[n.type ?? 'info'] ?? 'info',
        time: toRelativeTime(date),
        group: toNotificationGroup(date),
        read: n.read,
        link: n.link ?? undefined,
      };
    });

    const activities = rawActivities.map((a) => {
      const date = new Date(a.timestamp);
      return {
        id: a.id,
        title: a.title,
        description: a.description ?? '',
        time: date.toISOString(),
        type: ACTIVITY_TYPE_MAP[a.category ?? 'profile'] ?? 'profile',
        group: toActivityGroup(date),
      };
    });

    return NextResponse.json({ applications, certificates, notifications, activities });
  } catch (error) {
    console.error('[dashboard] GET error:', error);
    return NextResponse.json({ error: 'Failed to load dashboard data' }, { status: 500 });
  }
}
