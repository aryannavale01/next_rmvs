import type { Prisma } from "@prisma/client";
import { buildVerificationUrl } from "./certificate-pdf";

export interface CertifiableEnrollment {
  id: string;
  profileId: string;
  courseId: string;
  batchLabel: string | null;
  trainer: string | null;
  completionDate: Date | null;
}

export interface GeneratedCertificate {
  id: string;
  certificateNumber: string;
  profileId: string;
  courseId: string | null;
  batch: string | null;
  teacherName: string | null;
  completionDate: Date | null;
  generationDate: Date | null;
  issueDate: Date | null;
  status: string;
  publishedStatus: string;
  templateName: string | null;
  language: string;
  verificationUrl: string | null;
  generatedBy: string | null;
}

export async function nextCertificateNumber(
  tx: Prisma.TransactionClient,
  year: number,
): Promise<string> {
  const prefix = `MH-SKILL-${year}-`;
  const last = await tx.certificate.findFirst({
    where: { certificateNumber: { startsWith: prefix } },
    orderBy: { certificateNumber: "desc" },
    select: { certificateNumber: true },
  });
  const seq = last ? parseInt(last.certificateNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(5, "0")}`;
}

/**
 * Create Certificate rows for the given enrollments inside the caller's
 * transaction. Certificate numbers are precomputed from a single max-number
 * query, then all rows are written with createMany/updateMany — no per-row
 * round trips, so it stays well within interactive-transaction timeouts.
 */
export async function generateCertificatesForEnrollments(opts: {
  tx: Prisma.TransactionClient;
  enrollments: CertifiableEnrollment[];
  adminId: string;
  baseUrl: string;
  year?: number;
}): Promise<GeneratedCertificate[]> {
  const { tx, enrollments, adminId, baseUrl } = opts;
  const year = opts.year ?? new Date().getFullYear();
  const now = new Date();
  const prefix = `MH-SKILL-${year}-`;

  if (enrollments.length === 0) return [];

  const last = await tx.certificate.findFirst({
    where: { certificateNumber: { startsWith: prefix } },
    orderBy: { certificateNumber: "desc" },
    select: { certificateNumber: true },
  });
  const startSeq = last ? parseInt(last.certificateNumber.slice(prefix.length), 10) : 0;

  const certificateNumbers = enrollments.map(
    (_, i) => `${prefix}${String(startSeq + i + 1).padStart(5, "0")}`,
  );

  await tx.certificate.createMany({
    data: enrollments.map((enr, i) => ({
      certificateNumber: certificateNumbers[i],
      profileId: enr.profileId,
      courseId: enr.courseId,
      batch: enr.batchLabel,
      teacherName: enr.trainer,
      completionDate: enr.completionDate,
      generationDate: now,
      status: "pending",
      publishedStatus: "pending",
      templateName: "default",
      language: "English",
      verificationUrl: buildVerificationUrl(baseUrl, certificateNumbers[i]),
      generatedBy: adminId,
    })),
  });

  await tx.courseEnrollment.updateMany({
    where: { id: { in: enrollments.map((e) => e.id) } },
    data: { certificateGenerated: true, status: "certified" },
  });

  const created = await tx.certificate.findMany({
    where: { certificateNumber: { in: certificateNumbers } },
  });

  return created.map((cert) => ({
    id: cert.id,
    certificateNumber: cert.certificateNumber,
    profileId: cert.profileId,
    courseId: cert.courseId,
    batch: cert.batch,
    teacherName: cert.teacherName,
    completionDate: cert.completionDate,
    generationDate: cert.generationDate,
    issueDate: cert.issueDate,
    status: cert.status,
    publishedStatus: cert.publishedStatus,
    templateName: cert.templateName,
    language: cert.language,
    verificationUrl: cert.verificationUrl,
    generatedBy: cert.generatedBy,
  }));
}
