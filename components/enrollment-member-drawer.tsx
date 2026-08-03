"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  FileText,
  BookOpen,
  MessageSquare,
  CreditCard,
  Activity,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from "@/lib/admin-stepup";

interface MemberDetail {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  district: string;
  state: string;
  aadhaarNumber: string;
  qualification: string;
  avatarUrl: string | null;
  photoUrlHQ: string | null;
}

interface ApplicationDetail {
  id: string;
  status: string;
  appliedDate: string;
  seatReservedAt: string | null;
  waitlistedAt: string | null;
  convertedAt: string | null;
  reviewNotes: string | null;
  rejectionReason: string | null;
  reviewedAt: string | null;
  notes: string | null;
  documents: unknown;
  paymentStatus: string;
  amountPaid: string;
  member: MemberDetail;
  course: {
    id: string;
    title: string;
    category: string;
    level: string;
    duration: string;
    seatsTotal: number;
  };
  enrollment: {
    id: string;
    status: string;
    enrollmentDate: string;
    attendance: number;
    batchLabel: string;
    seatNumber: number;
  } | null;
  adminNotes: { id: string; text: string; authorId: string; createdAt: string }[];
}

interface EnrollmentMemberDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  applicationId: string | null;
  initialTab?: Tab;
  seatInfo?: { available: number; isFull: boolean };
  onActionComplete?: () => void;
}

type Tab = "overview" | "timeline" | "documents" | "enrollment" | "notes" | "payments";

// The drawer is only rendered inside the course workspace (/admin/enrollments/[courseId]),
// so the step-up return path should always be the current page, preserving the course context.
function stepUpReturnPath(): string {
  if (typeof window === "undefined") return "/admin/enrollments";
  const path = window.location.pathname;
  return path.startsWith("/admin/enrollments") ? path : "/admin/enrollments";
}

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "overview", label: "Overview", icon: User },
  { key: "timeline", label: "Timeline", icon: Activity },
  { key: "documents", label: "Documents", icon: FileText },
  { key: "enrollment", label: "Enrollment", icon: BookOpen },
  { key: "notes", label: "Notes", icon: MessageSquare },
  { key: "payments", label: "Payments", icon: CreditCard },
];

export default function EnrollmentMemberDrawer({ isOpen, onClose, applicationId, initialTab = "overview", seatInfo, onActionComplete }: EnrollmentMemberDrawerProps) {
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [data, setData] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [docActionLoading, setDocActionLoading] = useState<string | null>(null);
  const prevOpenRef = React.useRef(isOpen);

  useEffect(() => {
    if (isOpen && !prevOpenRef.current) {
      setActiveTab(initialTab);
    }
    prevOpenRef.current = isOpen;
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen || !applicationId) return;
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/enrollments/${applicationId}`);
        const json = await res.json();
        setData(json.data);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, applicationId]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleDocumentAction = async (documentType: string, action: "verify" | "reject") => {
    if (!applicationId) return;
    if (!(await requireStepUpClient(stepUpReturnPath(), 'manage_enrollments'))) return;
    setDocActionLoading(documentType);
    try {
      const res = await fetch(`/api/admin/enrollments/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentAction: { documentType, action } }),
      });
      if (res.ok) {
        const json = await res.json();
        setData((prev) => (prev ? {
          ...prev,
          documents: json.data.documents,
          status: json.data.status ?? prev.status,
        } : prev));
        onActionComplete?.();
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(stepUpReturnPath(), 'manage_enrollments');
        }
      }
    } finally {
      setDocActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-xl bg-card border-l border-border shadow-2xl flex flex-col animate-slide-in-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0">
          {data?.member.photoUrlHQ || data?.member.avatarUrl ? (
            <img
              src={data.member.photoUrlHQ || data.member.avatarUrl!}
              alt={data.member.fullName}
              className="w-9 h-9 rounded-full object-cover border border-border"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-border">
              <span className="text-xs font-bold text-primary">
                {data?.member.fullName ? data.member.fullName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() : "?"}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground truncate">
              {loading ? "Loading..." : data?.member.fullName ?? "Member Detail"}
            </h3>
            <p className="text-[10px] text-muted-foreground truncate">{data?.member.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto shrink-0">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Action Bar */}
        {data && (
          <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/20 shrink-0">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Actions:</span>
            {data.status === "pending" && (
              <button
                onClick={async () => {
                  if (!(await requireStepUpClient(stepUpReturnPath(), 'manage_enrollments'))) return;
                  const res = await fetch(`/api/admin/enrollments/${applicationId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "under_review" }),
                  });
                  if (!res.ok) {
                    const body = await res.json();
                    if (isStepUpRequiredResponse(res.status, body.error)) {
                      redirectToStepUp(stepUpReturnPath(), 'manage_enrollments');
                    }
                    return;
                  }
                  setData((prev) => prev ? { ...prev, status: "under_review" } : prev);
                  onActionComplete?.();
                }}
                className="px-2 py-1 text-[9px] font-medium bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Move to Review
              </button>
            )}
            {data.status === "under_review" && (
              <button
                onClick={() => setActiveTab("documents")}
                className="px-2 py-1 text-[9px] font-medium bg-indigo-500 text-white rounded hover:bg-indigo-600 transition-colors"
              >
                Review Docs
              </button>
            )}
            {data.status === "documents_verified" && (
              <button
                onClick={async () => {
                  if (!seatInfo || seatInfo.isFull) return;
                  if (!(await requireStepUpClient(stepUpReturnPath(), 'manage_enrollments'))) return;
                  const res = await fetch(`/api/admin/enrollments/${applicationId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "seat_reserved" }),
                  });
                  if (!res.ok) {
                    const body = await res.json();
                    if (isStepUpRequiredResponse(res.status, body.error)) {
                      redirectToStepUp(stepUpReturnPath(), 'manage_enrollments');
                    }
                    return;
                  }
                  setData((prev) => prev ? { ...prev, status: "seat_reserved" } : prev);
                  onActionComplete?.();
                }}
                disabled={!!seatInfo?.isFull}
                className="px-2 py-1 text-[9px] font-medium bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Enroll
              </button>
            )}
            {data.status === "waitlisted" && (
              <button
                onClick={async () => {
                  if (!seatInfo || seatInfo.isFull) return;
                  if (!(await requireStepUpClient(stepUpReturnPath(), 'manage_enrollments'))) return;
                  const res = await fetch(`/api/admin/enrollments/${applicationId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ status: "seat_reserved" }),
                  });
                  if (!res.ok) {
                    const body = await res.json();
                    if (isStepUpRequiredResponse(res.status, body.error)) {
                      redirectToStepUp(stepUpReturnPath(), 'manage_enrollments');
                    }
                    return;
                  }
                  setData((prev) => prev ? { ...prev, status: "seat_reserved" } : prev);
                  onActionComplete?.();
                }}
                disabled={!!seatInfo?.isFull}
                className="px-2 py-1 text-[9px] font-medium bg-emerald-500 text-white rounded hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Promote
              </button>
            )}
            {data.status === "rejected" && (
              <span className="text-[9px] text-red-500 font-medium">Rejected</span>
            )}
            {data.status === "seat_reserved" && (
              <span className="text-[9px] text-emerald-600 font-medium">Seat Reserved</span>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : !data ? (
            <p className="text-xs text-muted-foreground text-center py-8">Failed to load data</p>
          ) : (
            <>
              {activeTab === "overview" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <InfoItem label="Phone" value={data.member.phone} />
                    <InfoItem label="District" value={data.member.district} />
                    <InfoItem label="State" value={data.member.state} />
                    <InfoItem label="Qualification" value={data.member.qualification} />
                    <InfoItem label="Gender" value={data.member.gender} />
                    <InfoItem label="DOB" value={data.member.dob} />
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Course</p>
                    <p className="text-xs font-semibold text-foreground">{data.course.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {data.course.category} · {data.course.level} · {data.course.duration}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-1">Application Status</p>
                    <p className="text-xs font-semibold text-foreground">{data.status}</p>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-3">
                  <TimelineEntry label="Applied" date={data.appliedDate} />
                  {data.seatReservedAt && <TimelineEntry label="Seat Reserved" date={data.seatReservedAt} />}
                  {data.waitlistedAt && <TimelineEntry label="Waitlisted" date={data.waitlistedAt} />}
                  {data.convertedAt && <TimelineEntry label="Converted" date={data.convertedAt} />}
                  {data.status === "rejected" && data.reviewedAt && (
                    <TimelineEntry label="Rejected" date={data.reviewedAt} />
                  )}
                  {data.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-[10px] font-semibold text-red-700">Rejection Reason</p>
                      <p className="text-xs text-red-600">{data.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "documents" && (
                <div className="space-y-2">
                  <DocumentList
                    documents={data.documents}
                    onAction={handleDocumentAction}
                    loading={docActionLoading}
                  />
                </div>
              )}

              {activeTab === "enrollment" && (
                <div className="space-y-3">
                  {data.enrollment ? (
                    <div className="grid grid-cols-2 gap-3">
                      <InfoItem label="Enrollment Status" value={data.enrollment.status} />
                      <InfoItem label="Enrollment Date" value={data.enrollment.enrollmentDate} />
                      <InfoItem label="Attendance" value={`${data.enrollment.attendance}%`} />
                      <InfoItem label="Batch" value={data.enrollment.batchLabel} />
                      <InfoItem label="Seat Number" value={data.enrollment.seatNumber?.toString()} />
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">Not yet enrolled</p>
                  )}
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-2">
                  {data.adminNotes.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">No notes</p>
                  ) : (
                    data.adminNotes.map((note) => (
                      <div key={note.id} className="bg-muted/30 border border-border/50 rounded-lg p-3">
                        <p className="text-[9px] text-muted-foreground mb-1">{note.createdAt}</p>
                        <p className="text-xs text-foreground">{note.text}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "payments" && (
                <div className="space-y-3">
                  <InfoItem label="Payment Status" value={data.paymentStatus} />
                  <InfoItem label="Amount Paid" value={`₹${data.amountPaid}`} />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-xs font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function TimelineEntry({ label, date }: { label: string; date: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full bg-emerald-500" />
      <div>
        <p className="text-xs font-semibold text-foreground">{label}</p>
        <p className="text-[10px] text-muted-foreground">{date}</p>
      </div>
    </div>
  );
}

function DocumentList({
  documents,
  onAction,
  loading,
}: {
  documents: unknown;
  onAction?: (documentType: string, action: "verify" | "reject") => void;
  loading?: string | null;
}) {
  if (!documents || !Array.isArray(documents)) {
    return <p className="text-xs text-muted-foreground text-center py-4">No documents uploaded</p>;
  }

  const docs = documents as { type: string; status: string }[];

  return (
    <>
      {docs.map((doc, idx) => (
        <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-lg">
          <div>
            <p className="text-xs font-semibold text-foreground capitalize">{doc.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                doc.status === "verified"
                  ? "bg-emerald-100 text-emerald-700"
                  : doc.status === "rejected"
                    ? "bg-red-100 text-red-700"
                    : doc.status === "pending"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-gray-100 text-gray-500"
              }`}
            >
              {doc.status}
            </span>
            {onAction && doc.status === "pending" && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onAction(doc.type, "verify")}
                  disabled={loading === doc.type}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === doc.type ? "..." : <><CheckCircle2 className="w-3 h-3" /> Approve</>}
                </button>
                <button
                  onClick={() => onAction(doc.type, "reject")}
                  disabled={loading === doc.type}
                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading === doc.type ? "..." : <><XCircle className="w-3 h-3" /> Reject</>}
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
