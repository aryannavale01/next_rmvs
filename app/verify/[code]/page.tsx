import { prisma, withRetry } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: Date | null): string {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default async function VerifyPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;

  if (!code || code.length < 8) {
    notFound();
  }

  let cert: {
    id: string;
    certificateNumber: string;
    verificationCode: string | null;
    memberName: string | null;
    courseName: string | null;
    batch: string | null;
    teacherName: string | null;
    completionDate: Date | null;
    issueDate: Date | null;
    generationDate: Date | null;
    status: string;
    revokedAt: Date | null;
    revokedReason: string | null;
    publishedStatus: string;
  } | null = null;

  try {
    cert = await withRetry(() =>
      prisma.certificate.findUnique({
        where: { verificationCode: code },
        select: {
          id: true,
          certificateNumber: true,
          verificationCode: true,
          memberName: true,
          courseName: true,
          batch: true,
          teacherName: true,
          completionDate: true,
          issueDate: true,
          generationDate: true,
          status: true,
          revokedAt: true,
          revokedReason: true,
          publishedStatus: true,
        },
      })
    );
  } catch (err) {
    console.error("[verify] DB error", err);
    notFound();
  }

  if (!cert) {
    notFound();
  }

  const isRevoked = cert.status === "revoked" || cert.revokedAt !== null;
  const isValid = !isRevoked && (cert.publishedStatus === "published" || cert.status === "generated" || cert.status === "downloaded");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck size={22} className="text-primary" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Certificate Verification</h1>
          </div>
          <p className="text-sm text-slate-500">
            CompassionGlobal — MH-SKILL Program
          </p>
        </div>

        {/* Verification Result Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
          {/* Status Banner */}
          <div
            className={`px-6 py-4 flex items-center gap-3 ${
              isValid
                ? "bg-emerald-50 border-b border-emerald-200"
                : isRevoked
                ? "bg-red-50 border-b border-red-200"
                : "bg-amber-50 border-b border-amber-200"
            }`}
          >
            {isValid ? (
              <ShieldCheck size={24} className="text-emerald-600" />
            ) : isRevoked ? (
              <ShieldX size={24} className="text-red-600" />
            ) : (
              <ShieldAlert size={24} className="text-amber-600" />
            )}
            <div>
              <h2
                className={`font-bold text-base ${
                  isValid
                    ? "text-emerald-800"
                    : isRevoked
                    ? "text-red-800"
                    : "text-amber-800"
                }`}
              >
                {isValid
                  ? "Certificate Verified"
                  : isRevoked
                  ? "Certificate Revoked"
                  : "Certificate Pending"}
              </h2>
              <p
                className={`text-xs ${
                  isValid
                    ? "text-emerald-600"
                    : isRevoked
                    ? "text-red-600"
                    : "text-amber-600"
                }`}
              >
                {isValid
                  ? "This certificate is valid and verified."
                  : isRevoked
                  ? "This certificate has been revoked and is no longer valid."
                  : "This certificate has not yet been published."}
              </p>
            </div>
          </div>

          {/* Certificate Details */}
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Certificate Number
                </p>
                <p className="text-sm font-mono font-bold text-slate-800 mt-0.5">
                  {cert.certificateNumber}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Verification Code
                </p>
                <p className="text-sm font-mono font-bold text-slate-800 mt-0.5 break-all">
                  {cert.verificationCode}
                </p>
              </div>
            </div>

            <div className="h-px bg-slate-100" />

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Recipient Name
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {cert.memberName || "—"}
              </p>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Course / Program
              </p>
              <p className="text-sm font-semibold text-slate-800 mt-0.5">
                {cert.courseName || "—"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Completion Date
                </p>
                <p className="text-sm text-slate-700 mt-0.5">
                  {formatDate(cert.completionDate)}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Issue Date
                </p>
                <p className="text-sm text-slate-700 mt-0.5">
                  {formatDate(cert.issueDate)}
                </p>
              </div>
            </div>

            {cert.batch && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Batch
                </p>
                <p className="text-sm text-slate-700 mt-0.5">{cert.batch}</p>
              </div>
            )}

            {cert.teacherName && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Trainer
                </p>
                <p className="text-sm text-slate-700 mt-0.5">{cert.teacherName}</p>
              </div>
            )}

            {isRevoked && cert.revokedReason && (
              <>
                <div className="h-px bg-red-100" />
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                    Revocation Reason
                  </p>
                  <p className="text-xs text-red-700 mt-1">{cert.revokedReason}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            Verified at {new Date().toLocaleString("en-IN")} — CompassionGlobal
          </p>
        </div>
      </div>
    </div>
  );
}
