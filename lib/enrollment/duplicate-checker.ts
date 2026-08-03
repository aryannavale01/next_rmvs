import { prisma } from "@/lib/prisma";

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  existingApplicationId: string | null;
  existingApplicationStatus: string | null;
  reason: string | null;
}

export type DuplicateCheckStrategy =
  | "profile_course"
  | "email_course"
  | "aadhaar_course"
  | "composite";

const DEFAULT_STRATEGY: DuplicateCheckStrategy = "composite";

export async function checkDuplicate(
  profileId: string,
  courseId: string,
  strategy: DuplicateCheckStrategy = DEFAULT_STRATEGY,
): Promise<DuplicateCheckResult> {
  const checks = getChecksForStrategy(strategy);
  const results = await Promise.all(checks.map((check) => check(profileId, courseId)));

  const duplicate = results.find((r) => r.isDuplicate);
  if (duplicate) return duplicate;

  return {
    isDuplicate: false,
    existingApplicationId: null,
    existingApplicationStatus: null,
    reason: null,
  };
}

function getChecksForStrategy(
  strategy: DuplicateCheckStrategy,
): ((profileId: string, courseId: string) => Promise<DuplicateCheckResult>)[] {
  switch (strategy) {
    case "profile_course":
      return [checkProfileCourseDuplicate];
    case "email_course":
      return [checkEmailCourseDuplicate];
    case "aadhaar_course":
      return [checkAadhaarCourseDuplicate];
    case "composite":
    default:
      return [checkProfileCourseDuplicate, checkAadhaarCourseDuplicate];
  }
}

async function checkProfileCourseDuplicate(
  profileId: string,
  courseId: string,
): Promise<DuplicateCheckResult> {
  const existing = await prisma.courseApplication.findUnique({
    where: { profileId_courseId: { profileId, courseId } },
    select: { id: true, status: true },
  });

  if (existing) {
    return {
      isDuplicate: true,
      existingApplicationId: existing.id,
      existingApplicationStatus: existing.status,
      reason: "Member already has an application for this course",
    };
  }

  return { isDuplicate: false, existingApplicationId: null, existingApplicationStatus: null, reason: null };
}

async function checkEmailCourseDuplicate(
  profileId: string,
  courseId: string,
): Promise<DuplicateCheckResult> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { email: true },
  });
  if (!profile) {
    return { isDuplicate: false, existingApplicationId: null, existingApplicationStatus: null, reason: null };
  }

  const profilesByEmail = await prisma.profile.findMany({
    where: { email: profile.email },
    select: { id: true },
  });
  const profileIds = profilesByEmail.map((p) => p.id);

  const existing = await prisma.courseApplication.findFirst({
    where: {
      courseId,
      profileId: { in: profileIds },
    },
    select: { id: true, status: true },
  });

  if (existing) {
    return {
      isDuplicate: true,
      existingApplicationId: existing.id,
      existingApplicationStatus: existing.status,
      reason: "Another account with the same email already applied for this course",
    };
  }

  return { isDuplicate: false, existingApplicationId: null, existingApplicationStatus: null, reason: null };
}

async function checkAadhaarCourseDuplicate(
  profileId: string,
  courseId: string,
): Promise<DuplicateCheckResult> {
  const profile = await prisma.profile.findUnique({
    where: { id: profileId },
    select: { aadhaarNumber: true },
  });
  if (!profile?.aadhaarNumber) {
    return { isDuplicate: false, existingApplicationId: null, existingApplicationStatus: null, reason: null };
  }

  const profilesByAadhaar = await prisma.profile.findMany({
    where: { aadhaarNumber: profile.aadhaarNumber },
    select: { id: true },
  });
  const profileIds = profilesByAadhaar.map((p) => p.id);

  const existing = await prisma.courseApplication.findFirst({
    where: {
      courseId,
      profileId: { in: profileIds },
    },
    select: { id: true, status: true },
  });

  if (existing) {
    return {
      isDuplicate: true,
      existingApplicationId: existing.id,
      existingApplicationStatus: existing.status,
      reason: "Another account with the same Aadhaar number already applied for this course",
    };
  }

  return { isDuplicate: false, existingApplicationId: null, existingApplicationStatus: null, reason: null };
}
