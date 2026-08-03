import { prisma } from "@/lib/prisma";

export interface HealthIndicator {
  courseId: string;
  overall: "healthy" | "warning" | "critical";
  score: number;
  factors: HealthFactor[];
}

export interface HealthFactor {
  name: string;
  status: "good" | "warning" | "critical";
  value: number;
  threshold: number;
  message: string;
}

export interface HealthThresholds {
  minEnrollmentRate: number;
  minCompletionRate: number;
  maxDropoutRate: number;
  minAttendanceRate: number;
  maxWaitlistRatio: number;
}

const DEFAULT_THRESHOLDS: HealthThresholds = {
  minEnrollmentRate: 0.6,
  minCompletionRate: 0.7,
  maxDropoutRate: 0.15,
  minAttendanceRate: 0.7,
  maxWaitlistRatio: 0.3,
};

export async function computeHealthIndicator(
  courseId: string,
  thresholds: HealthThresholds = DEFAULT_THRESHOLDS,
): Promise<HealthIndicator> {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { id: true, seatsTotal: true },
  });

  const capacity = course.seatsTotal ?? 1;

  const [totalApplications, totalEnrollments, activeEnrollments, completedEnrollments, droppedEnrollments, waitlistedCount, avgAttendance] =
    await Promise.all([
      prisma.courseApplication.count({ where: { courseId } }),
      prisma.courseEnrollment.count({ where: { courseId } }),
      prisma.courseEnrollment.count({ where: { courseId, status: { in: ["enrolled", "in_progress"] } } }),
      prisma.courseEnrollment.count({ where: { courseId, status: "completed" } }),
      prisma.courseEnrollment.count({ where: { courseId, status: "dropped" } }),
      prisma.courseApplication.count({ where: { courseId, status: "waitlisted" } }),
      prisma.courseEnrollment.aggregate({
        where: { courseId, attendance: { gt: 0 } },
        _avg: { attendance: true },
      }),
    ]);

  const factors: HealthFactor[] = [];

  const enrollmentRate = totalApplications > 0 ? totalEnrollments / totalApplications : 0;
  factors.push({
    name: "Enrollment Rate",
    status: enrollmentRate >= thresholds.minEnrollmentRate ? "good" : enrollmentRate >= thresholds.minEnrollmentRate * 0.7 ? "warning" : "critical",
    value: Math.round(enrollmentRate * 100),
    threshold: Math.round(thresholds.minEnrollmentRate * 100),
    message: `${Math.round(enrollmentRate * 100)}% of applicants enrolled`,
  });

  const completionRate = totalEnrollments > 0 ? completedEnrollments / totalEnrollments : 0;
  factors.push({
    name: "Completion Rate",
    status: completionRate >= thresholds.minCompletionRate ? "good" : completionRate >= thresholds.minCompletionRate * 0.7 ? "warning" : "critical",
    value: Math.round(completionRate * 100),
    threshold: Math.round(thresholds.minCompletionRate * 100),
    message: `${Math.round(completionRate * 100)}% of enrolled completed the course`,
  });

  const dropoutRate = totalEnrollments > 0 ? droppedEnrollments / totalEnrollments : 0;
  factors.push({
    name: "Dropout Rate",
    status: dropoutRate <= thresholds.maxDropoutRate ? "good" : dropoutRate <= thresholds.maxDropoutRate * 1.5 ? "warning" : "critical",
    value: Math.round(dropoutRate * 100),
    threshold: Math.round(thresholds.maxDropoutRate * 100),
    message: `${Math.round(dropoutRate * 100)}% dropped out`,
  });

  const avgAttendanceValue = Number(avgAttendance._avg.attendance ?? 0);
  factors.push({
    name: "Average Attendance",
    status: avgAttendanceValue >= thresholds.minAttendanceRate * 100
      ? "good"
      : avgAttendanceValue >= thresholds.minAttendanceRate * 70
        ? "warning"
        : "critical",
    value: Math.round(avgAttendanceValue),
    threshold: Math.round(thresholds.minAttendanceRate * 100),
    message: `${Math.round(avgAttendanceValue)}% average attendance`,
  });

  const waitlistRatio = capacity > 0 ? waitlistedCount / capacity : 0;
  factors.push({
    name: "Waitlist Pressure",
    status: waitlistRatio <= thresholds.maxWaitlistRatio
      ? "good"
      : waitlistRatio <= thresholds.maxWaitlistRatio * 1.5
        ? "warning"
        : "critical",
    value: waitlistedCount,
    threshold: Math.round(capacity * thresholds.maxWaitlistRatio),
    message: `${waitlistedCount} on waitlist`,
  });

  const criticalCount = factors.filter((f) => f.status === "critical").length;
  const warningCount = factors.filter((f) => f.status === "warning").length;

  const score = Math.max(0, 100 - criticalCount * 25 - warningCount * 10);
  const overall: HealthIndicator["overall"] = criticalCount > 0 ? "critical" : warningCount > 1 ? "warning" : "healthy";

  return {
    courseId: course.id,
    overall,
    score,
    factors,
  };
}
