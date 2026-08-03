import { prisma } from "@/lib/prisma";

export interface SeatAvailability {
  courseId: string;
  capacity: number;
  reserved: number;
  enrolled: number;
  available: number;
  isFull: boolean;
  waitlistCount: number;
}

export async function getSeatAvailability(courseId: string): Promise<SeatAvailability> {
  const course = await prisma.course.findUniqueOrThrow({
    where: { id: courseId },
    select: { id: true, seatsTotal: true },
  });

  const capacity = course.seatsTotal ?? 0;

  const [reservationCount, enrollmentCount, waitlistCount] = await Promise.all([
    prisma.courseApplication.count({
      where: {
        courseId,
        status: { in: ["seat_reserved"] },
        convertedAt: null,
      },
    }),
    prisma.courseEnrollment.count({
      where: {
        courseId,
        status: { in: ["enrolled", "in_progress"] },
      },
    }),
    prisma.courseApplication.count({
      where: {
        courseId,
        status: "waitlisted",
      },
    }),
  ]);

  const available = Math.max(0, capacity - reservationCount - enrollmentCount);

  return {
    courseId: course.id,
    capacity,
    reserved: reservationCount,
    enrolled: enrollmentCount,
    available,
    isFull: available === 0,
    waitlistCount,
  };
}

export async function getSeatAvailabilityBulk(courseIds: string[]): Promise<Map<string, SeatAvailability>> {
  if (courseIds.length === 0) return new Map();

  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, seatsTotal: true },
  });

  const [reservations, enrollments, waitlists] = await Promise.all([
    prisma.courseApplication.groupBy({
      by: ["courseId"],
      where: {
        courseId: { in: courseIds },
        status: "seat_reserved",
        convertedAt: null,
      },
      _count: true,
    }),
    prisma.courseEnrollment.groupBy({
      by: ["courseId"],
      where: {
        courseId: { in: courseIds },
        status: { in: ["enrolled", "in_progress"] },
      },
      _count: true,
    }),
    prisma.courseApplication.groupBy({
      by: ["courseId"],
      where: {
        courseId: { in: courseIds },
        status: "waitlisted",
      },
      _count: true,
    }),
  ]);

  const reservationMap = new Map(reservations.map((r) => [r.courseId, r._count]));
  const enrollmentMap = new Map(enrollments.map((e) => [e.courseId, e._count]));
  const waitlistMap = new Map(waitlists.map((w) => [w.courseId, w._count]));

  const result = new Map<string, SeatAvailability>();
  for (const course of courses) {
    const capacity = course.seatsTotal ?? 0;
    const reserved = reservationMap.get(course.id) ?? 0;
    const enrolled = enrollmentMap.get(course.id) ?? 0;
    const waitlistCount = waitlistMap.get(course.id) ?? 0;
    const available = Math.max(0, capacity - reserved - enrolled);

    result.set(course.id, {
      courseId: course.id,
      capacity,
      reserved,
      enrolled,
      available,
      isFull: available === 0,
      waitlistCount,
    });
  }

  return result;
}
