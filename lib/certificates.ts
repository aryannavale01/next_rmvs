import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import { buildVerificationUrl } from "./certificate-pdf";

export interface CertifiableEnrollment {
  id: string;
  profileId: string;
  courseId: string;
  batchLabel: string | null;
  trainer: string | null;
  completionDate: Date | null;
  memberName: string;
  courseName: string;
}

export interface GeneratedCertificate {
  id: string;
  certificateNumber: string;
  verificationCode: string;
  profileId: string;
  courseId: string | null;
  enrollmentId: string | null;
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
  pdfStoragePath: string | null;
  memberName: string | null;
  courseName: string | null;
  generatedBy: string | null;
}

function generateVerificationCode(): string {
  return crypto.randomBytes(16).toString("base64url");
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
 * query, then all rows are written with createMany — no per-row round trips.
 *
 * Each certificate gets a cryptographically random verificationCode for
 * public verification URLs and QR codes.
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

  // Generate certificate numbers and verification codes
  const certData = enrollments.map((enr, i) => {
    const certNumber = `${prefix}${String(startSeq + i + 1).padStart(5, "0")}`;
    const verificationCode = generateVerificationCode();
    return { certNumber, verificationCode, enrollment: enr };
  });

  // Insert one by one to handle rare verificationCode collisions via retry
  const created: Array<{ id: string; certificateNumber: string; verificationCode: string }> = [];
  for (const { certNumber, verificationCode, enrollment } of certData) {
    let attempts = 0;
    const MAX_ATTEMPTS = 3;
    while (attempts < MAX_ATTEMPTS) {
      try {
        const cert = await tx.certificate.create({
          data: {
            certificateNumber: certNumber,
            verificationCode,
            profileId: enrollment.profileId,
            courseId: enrollment.courseId,
            enrollmentId: enrollment.id,
            batch: enrollment.batchLabel,
            teacherName: enrollment.trainer,
            completionDate: enrollment.completionDate,
            generationDate: now,
            memberName: enrollment.memberName,
            courseName: enrollment.courseName,
            status: "pending",
            publishedStatus: "pending",
            templateName: "default",
            language: "English",
            verificationUrl: buildVerificationUrl(baseUrl, verificationCode),
            generatedBy: adminId,
          },
        });
        created.push({ id: cert.id, certificateNumber: cert.certificateNumber, verificationCode });
        break;
      } catch (err: unknown) {
        // P2002 = unique constraint violation — retry with new code
        if (err && typeof err === "object" && "code" in err && (err as { code: string }).code === "P2002" && attempts < MAX_ATTEMPTS - 1) {
          attempts++;
          continue;
        }
        throw err;
      }
    }
  }

  await tx.courseEnrollment.updateMany({
    where: { id: { in: enrollments.map((e) => e.id) } },
    data: { certificateGenerated: true, status: "certified" },
  });

  const certIds = created.map((c) => c.id);
  const fullCerts = await tx.certificate.findMany({
    where: { id: { in: certIds } },
  });

  return fullCerts.map((cert) => ({
    id: cert.id,
    certificateNumber: cert.certificateNumber,
    verificationCode: cert.verificationCode ?? "",
    profileId: cert.profileId,
    courseId: cert.courseId,
    enrollmentId: cert.enrollmentId,
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
    pdfStoragePath: cert.pdfStoragePath,
    memberName: cert.memberName,
    courseName: cert.courseName,
    generatedBy: cert.generatedBy,
  }));
}
