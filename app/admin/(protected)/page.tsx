import { requireAdmin } from '@/lib/session';
import { prisma, withRetry } from '@/lib/prisma';
import { getRecentActivity } from '@/lib/activity-log';
import DashboardClient from './dashboard-client';

export const dynamic = 'force-dynamic';

const MONTHS_BACK = 7;

function getMonthLabels(): { label: string; start: Date; end: Date }[] {
  const result: { label: string; start: Date; end: Date }[] = [];
  const now = new Date();
  for (let i = MONTHS_BACK - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
    const label = d.toLocaleString('en-US', { month: 'short' });
    result.push({ label, start, end });
  }
  return result;
}

export default async function AdminRootPage() {
  const auth = await requireAdmin();
  if (!auth.success) return null;

  const months = getMonthLabels();

  const [counts, recentMembers, recentCertificates, recentNotifications, activityLogs, chartData] = await withRetry(() =>
    Promise.all([
      prisma.$transaction([
        prisma.profile.count({ where: { status: { not: 'deleted' } } }),
        prisma.course.count({ where: { status: 'active' } }),
        prisma.certificate.count(),
        prisma.courseEnrollment.count({ where: { status: 'enrolled' } }),
        prisma.teacher.count({ where: { status: { not: 'deleted' } } }),
        prisma.courseEnrollment.count(),
        prisma.coupon.count({ where: { isActive: true, status: { not: 'deleted' } } }),
        prisma.broadcastNotification.count(),
      ]),
      prisma.profile.findMany({
        where: { status: { not: 'deleted' } },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, fullName: true, district: true, createdAt: true },
      }),
      prisma.certificate.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, certificateNumber: true, status: true, createdAt: true, profile: { select: { fullName: true } } },
      }),
      prisma.broadcastNotification.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true, description: true, createdAt: true },
      }),
      getRecentActivity(7),
      // Chart data: enrollments, certificates, and member counts per month
      Promise.all(
        months.map(async (m) => {
          const [enrollments, certificates, members] = await Promise.all([
            prisma.courseEnrollment.count({ where: { createdAt: { gte: m.start, lte: m.end } } }),
            prisma.certificate.count({ where: { createdAt: { gte: m.start, lte: m.end } } }),
            prisma.profile.count({ where: { createdAt: { gte: m.start, lte: m.end }, status: { not: 'deleted' } } }),
          ]);
          return { month: m.label, enrollments, certificates, members };
        }),
      ),
    ]),
  );

  const [totalMembers, activeCourses, totalCerts, pendingEnrollments, totalTeachers, totalEnrollments, totalCoupons, totalNotifs] = counts;

  // Build cumulative member growth
  const memberGrowth = chartData.reduce<Array<{ month: string; value: number }>>((acc, d) => {
    const prev = acc.length > 0 ? acc[acc.length - 1].value : 0;
    acc.push({ month: d.month, value: prev + d.members });
    return acc;
  }, []);

  return (
    <DashboardClient
      counts={{ totalMembers, activeCourses, totalCerts, pendingEnrollments, totalTeachers, totalEnrollments, totalCoupons, totalNotifs }}
      recentMembers={recentMembers.map(m => ({ ...m, createdAt: m.createdAt.toISOString().split('T')[0] }))}
      recentCertificates={recentCertificates.map(c => ({ id: c.id, certificateNo: c.certificateNumber, status: c.status, memberName: c.profile?.fullName ?? 'Unknown', createdAt: c.createdAt.toISOString().split('T')[0] }))}
      recentNotifications={recentNotifications.map(n => ({ id: n.id, title: n.title, description: n.description ?? '' }))}
      activityLogs={activityLogs}
      chartData={{
        bar: chartData.map(d => ({ month: d.month, value: d.enrollments })),
        line: chartData.map(d => ({ month: d.month, value: d.certificates })),
        area: memberGrowth,
      }}
    />
  );
}
