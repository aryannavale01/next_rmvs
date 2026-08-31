"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  Users,
  Clock,
  FileCheck,
  Search,
  Loader2,
  ChevronLeft,
  Download,
  Check,
  Sparkles,
} from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { getStatusStyle } from "@/lib/status-styles";
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from "@/lib/admin-stepup";

const CERT_ACTION = 'manage_certificates';

type Tab = "enrollments" | "certificates" | "requests";

interface CourseInfo {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string | null;
  seatsTotal: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
}

interface Overview {
  enrolled: number;
  completed: number;
  eligible: number;
  generated: number;
  approved: number;
  pending: number;
  revoked: number;
  pendingRequests: number;
}

interface EnrollmentRow {
  id: string;
  member: { id: string; name: string; email: string; phone: string | null; district: string | null };
  status: string;
  batchLabel: string | null;
  completionDate: string | null;
  certificateGenerated: boolean;
  certificate: { id: string; certificateNumber: string; status: string } | null;
}

interface CertificateRow {
  id: string;
  certificateNumber: string;
  memberName: string | null;
  status: string;
  publishedStatus: string;
  issueDate: string | null;
  generationDate: string | null;
  completionDate: string | null;
  batch: string | null;
  teacherName: string | null;
  verificationUrl: string | null;
}

interface RequestRow {
  id: string;
  memberName: string;
  email: string;
  courseTitle: string | null;
  batch: string | null;
  requestDate: string;
  status: string;
  notes: string | null;
}

interface DetailData {
  course: CourseInfo;
  overview: Overview;
  enrollments: EnrollmentRow[];
  certificates: CertificateRow[];
  requests: RequestRow[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  approved: "Approved",
  generated: "Generated",
  published: "Published",
  downloaded: "Downloaded",
  revoked: "Revoked",
};

const ENROLLMENT_BADGE_STYLES: Record<string, string> = {
  enrolled: "bg-emerald-100 text-emerald-700",
  in_progress: "bg-blue-100 text-blue-700",
  completed: "bg-purple-100 text-purple-700",
  certified: "bg-violet-100 text-violet-700",
  dropped: "bg-red-100 text-red-700",
};

function enrollmentBadge(status: string): string {
  return ENROLLMENT_BADGE_STYLES[status] ?? "bg-amber-100 text-amber-700";
}

const ELIGIBLE_STATUSES = new Set(["completed", "certified"]);

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function CertificateWorkspacePage({ params }: { params: Promise<{ courseId: string }> }) {
  const [courseId, setCourseId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("enrollments");
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectTarget, setRejectTarget] = useState<{ kind: "certificate" | "request"; id: string } | null>(null);
  const [rejectRemarks, setRejectRemarks] = useState("");
  const { toast } = useToast();

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/admin/certificates?courseId=${courseId}`);
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load");
    setData(json.data ?? null);
    setSelectedIds(new Set());
  }, [courseId]);

  const reload = useCallback(async () => {
    try {
      await fetchData();
    } catch (err) {
      toast({ title: "Failed to load", description: String(err), variant: "error" });
    }
  }, [fetchData, toast]);

  useEffect(() => {
    params.then((p) => setCourseId(p.courseId));
  }, [params]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;
    fetch(`/api/admin/certificates?courseId=${courseId}`)
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        if (!json.data) throw new Error("Failed to load");
        setData(json.data);
        setSelectedIds(new Set());
      })
      .catch((err) => {
        if (!cancelled) toast({ title: "Failed to load", description: String(err), variant: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [courseId, toast]);

  const eligibleEnrollments = useMemo(
    () =>
      (data?.enrollments ?? []).filter(
        (e) => ELIGIBLE_STATUSES.has(e.status) && !e.certificate,
      ),
    [data],
  );

  const filteredEnrollments = useMemo(() => {
    const q = search.toLowerCase();
    return (data?.enrollments ?? []).filter(
      (e) => e.member.name.toLowerCase().includes(q) || e.member.email.toLowerCase().includes(q),
    );
  }, [data, search]);

  const filteredCertificates = useMemo(() => {
    const q = search.toLowerCase();
    return (data?.certificates ?? []).filter(
      (c) =>
        c.certificateNumber.toLowerCase().includes(q) ||
        (c.memberName ?? "").toLowerCase().includes(q),
    );
  }, [data, search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllEligible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const e of eligibleEnrollments) next.add(e.id);
      return next;
    });
  };

  const generateCertificates = async (enrollmentIds: string[]) => {
    if (enrollmentIds.length === 0 || !courseId) return;
    if (!(await requireStepUpClient(`/admin/certificates/${courseId || ''}`, CERT_ACTION))) return;
    setBusy("generate");
    try {
      const res = await fetch("/api/admin/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, enrollmentIds }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (isStepUpRequiredResponse(res.status, json.error)) {
          redirectToStepUp(`/admin/certificates/${courseId || ''}`, CERT_ACTION);
          return;
        }
        throw new Error(json.error ?? json.details ?? "Generation failed");
      }
      toast({
        title: `${json.data.generated} certificate(s) generated`,
        description: "Now review and approve them in the Certificates tab.",
        variant: "success",
      });
      await reload();
    } catch (err) {
      toast({ title: "Generation failed", description: String(err), variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const approveCertificate = async (id: string) => {
    if (!(await requireStepUpClient(`/admin/certificates/${courseId || ''}`, CERT_ACTION))) return;
    setBusy(`approve-${id}`);
    try {
      const res = await fetch(`/api/admin/certificates/${id}/approve`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (isStepUpRequiredResponse(res.status, json.error)) {
          redirectToStepUp(`/admin/certificates/${courseId || ''}`, CERT_ACTION);
          return;
        }
        throw new Error(json.error ?? "Approval failed");
      }
      toast({ title: "Certificate approved", variant: "success" });
      await reload();
    } catch (err) {
      toast({ title: "Approval failed", description: String(err), variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const rejectCertificate = async (id: string) => {
    if (!(await requireStepUpClient(`/admin/certificates/${courseId || ''}`, CERT_ACTION))) return;
    setBusy(`reject-${id}`);
    try {
      const res = await fetch(`/api/admin/certificates/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remarks: rejectRemarks || null }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (isStepUpRequiredResponse(res.status, json.error)) {
          redirectToStepUp(`/admin/certificates/${courseId || ''}`, CERT_ACTION);
          return;
        }
        throw new Error(json.error ?? "Rejection failed");
      }
      toast({ title: "Certificate rejected", description: "The enrollment is now eligible to regenerate.", variant: "info" });
      await reload();
    } catch (err) {
      toast({ title: "Rejection failed", description: String(err), variant: "error" });
    } finally {
      setBusy(null);
      setRejectTarget(null);
      setRejectRemarks("");
    }
  };

  const resolveRequest = async (id: string, action: "approve" | "reject") => {
    if (!(await requireStepUpClient(`/admin/certificates/${courseId || ''}`, CERT_ACTION))) return;
    setBusy(`request-${action}-${id}`);
    try {
      const res = await fetch(`/api/admin/certificates/requests/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, notes: action === "reject" ? rejectRemarks || null : null }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (isStepUpRequiredResponse(res.status, json.error)) {
          redirectToStepUp(`/admin/certificates/${courseId || ''}`, CERT_ACTION);
          return;
        }
        throw new Error(json.error ?? "Failed to resolve request");
      }
      toast({
        title: action === "approve" ? "Request approved" : "Request rejected",
        description:
          action === "approve" ? `Certificate ${json.data.certificate?.certificateNumber ?? ""} created.` : undefined,
        variant: action === "approve" ? "success" : "info",
      });
      await reload();
    } catch (err) {
      toast({ title: "Failed to resolve request", description: String(err), variant: "error" });
    } finally {
      setBusy(null);
      setRejectTarget(null);
      setRejectRemarks("");
    }
  };

  const downloadCertificates = async (format: "pdf" | "zip") => {
    if (!data?.certificates.length) return;
    if (!(await requireStepUpClient(`/admin/certificates/${courseId || ''}`, CERT_ACTION))) return;
    setBusy(`download-${format}`);
    try {
      const res = await fetch("/api/admin/certificates/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, format }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        if (isStepUpRequiredResponse(res.status, json?.error)) {
          redirectToStepUp(`/admin/certificates/${courseId || ''}`, CERT_ACTION);
          return;
        }
        throw new Error(json?.error ?? "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = format === "zip" ? `certificates-${courseId}.zip` : `certificates-${courseId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({ title: format === "zip" ? "ZIP downloaded" : "PDF downloaded", variant: "success" });
    } catch (err) {
      toast({ title: "Download failed", description: String(err), variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  const downloadSingle = async (id: string, certNo: string) => {
    setBusy(`single-${id}`);
    try {
      const res = await fetch(`/api/admin/certificates/${id}/pdf`);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${certNo}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "Download failed", description: String(err), variant: "error" });
    } finally {
      setBusy(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        <span className="ml-2 text-xs text-muted-foreground">Loading workspace...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <EmptyState
          icon={Award}
          title="Workspace unavailable"
          description="The training could not be loaded."
          actionText="Back to Certificates"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  const { course, overview } = data;

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/certificates"
          className="p-2 rounded-lg border border-border hover:bg-accent transition-colors"
          aria-label="Back to certificates"
        >
          <ChevronLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold text-foreground truncate">{course.title}</h1>
          <p className="text-[10px] text-muted-foreground capitalize">
            {course.category} · {course.level} · {course.duration}
          </p>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <MetricCard icon={Users} label="Enrolled" value={overview.enrolled} />
        <MetricCard icon={Sparkles} label="Eligible" value={overview.eligible} />
        <MetricCard icon={Award} label="Generated" value={overview.generated} />
        <MetricCard icon={Check} label="Approved" value={overview.approved} />
        <MetricCard icon={Clock} label="Pending Review" value={overview.pending} />
      </div>

      {/* Tabs */}
      <div role="tablist" className="bg-card border border-border rounded-xl px-4 flex items-center gap-1 overflow-x-auto">
        {(
          [
            { key: "enrollments", label: "Enrollments", icon: Users },
            { key: "certificates", label: "Certificates", icon: Award },
            { key: "requests", label: "Requests", icon: FileCheck },
          ] as { key: Tab; label: string; icon: React.ElementType }[]
        ).map((tab) => {
          const count =
            tab.key === "enrollments"
              ? overview.enrolled
              : tab.key === "certificates"
                ? overview.generated
                : overview.pendingRequests;
          return (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => { setActiveTab(tab.key); setSearch(""); }}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                activeTab === tab.key ? "bg-primary-light text-primary" : "bg-muted text-muted-foreground"
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {activeTab === "enrollments" && (
        <div className="space-y-3">
          {/* Eligible banner */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {overview.eligible} member{overview.eligible !== 1 ? "s" : ""} eligible for certificates
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Completed members without a certificate. Generate now, then approve in the Certificates tab.
              </p>
            </div>
            {selectedIds.size > 0 && (
              <button
                onClick={() => generateCertificates(Array.from(selectedIds))}
                disabled={busy !== null}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50"
              >
                <Award className="w-3.5 h-3.5" />
                {busy === "generate" ? "Generating..." : `Generate Selected (${selectedIds.size})`}
              </button>
            )}
            <button
              onClick={() => generateCertificates(eligibleEnrollments.map((e) => e.id))}
              disabled={busy !== null || overview.eligible === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg disabled:opacity-50"
            >
              {busy === "generate" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Generate All Eligible
            </button>
          </div>

          {/* Search */}
          <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-2">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="flex-1 text-xs outline-none placeholder:text-muted-foreground bg-transparent"
            />
          </div>

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 w-10">
                      <button
                        onClick={selectAllEligible}
                        className="text-[10px] font-bold text-primary hover:underline"
                        title="Select all eligible"
                      >
                        Select
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completion</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-40">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredEnrollments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12">
                        <EmptyState
                          icon={Users}
                          title="No members"
                          description="No enrolled members match your search."
                        />
                      </td>
                    </tr>
                  )}
                  {filteredEnrollments.map((e) => {
                    const eligible = ELIGIBLE_STATUSES.has(e.status) && !e.certificate;
                    const isSelected = selectedIds.has(e.id);
                    return (
                      <tr key={e.id} className="hover:bg-primary-light/30 transition-colors">
                        <td className="px-4 py-3">
                          {eligible && (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(e.id)}
                              className="w-3.5 h-3.5 accent-primary"
                              aria-label={`Select ${e.member.name}`}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm font-semibold text-foreground">{e.member.name}</p>
                          <p className="text-[10px] text-muted-foreground">{e.member.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${enrollmentBadge(e.status)}`}>
                            {e.status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{e.batchLabel ?? "—"}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(e.completionDate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end">
                            {e.certificate ? (
                              <span className="text-[10px] font-bold text-success-text bg-success-bg border border-success/20 px-2 py-1 rounded-full">
                                {e.certificate.certificateNumber}
                              </span>
                            ) : eligible ? (
                              <button
                                onClick={() => generateCertificates([e.id])}
                                disabled={busy !== null}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50"
                              >
                                <Award className="w-3 h-3" /> Generate
                              </button>
                            ) : (
                              <span className="text-[10px] text-muted-foreground italic">Awaiting completion</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "certificates" && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">
                {overview.generated} certificate{overview.generated !== 1 ? "s" : ""} generated
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {overview.pending} pending review · {overview.approved} approved
              </p>
            </div>
            <button
              onClick={() => downloadCertificates("pdf")}
              disabled={busy !== null || overview.generated === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent disabled:opacity-50"
            >
              {busy === "download-pdf" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download PDF
            </button>
            <button
              onClick={() => downloadCertificates("zip")}
              disabled={busy !== null || overview.generated === 0}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-border rounded-lg hover:bg-accent disabled:opacity-50"
            >
              {busy === "download-zip" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              Download ZIP
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Certificate No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Issue Date</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-52">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredCertificates.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-12">
                        <EmptyState
                          icon={Award}
                          title="No certificates yet"
                          description="Generate certificates from the Enrollments tab."
                        />
                      </td>
                    </tr>
                  )}
                  {filteredCertificates.map((c) => (
                    <tr key={c.id} className="hover:bg-primary-light/30 transition-colors">
                      <td className="px-4 py-3 text-sm font-mono font-semibold text-foreground">{c.certificateNumber}</td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{c.memberName ?? "Unknown member"}</p>
                        {c.batch && <p className="text-[10px] text-muted-foreground">Batch: {c.batch}</p>}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(c.issueDate)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${getStatusStyle(c.status)}`}>
                          {STATUS_LABELS[c.status] ?? c.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          {c.status === "pending" && (
                            <>
                              <button
                                onClick={() => approveCertificate(c.id)}
                                disabled={busy !== null}
                                className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50"
                              >
                                {busy === `approve-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                                Approve
                              </button>
                              <button
                                onClick={() => setRejectTarget({ kind: "certificate", id: c.id })}
                                disabled={busy !== null}
                                className="px-2.5 py-1.5 text-[10px] font-bold text-destructive border border-destructive/20 hover:bg-destructive-bg rounded-md transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {c.status !== "pending" && c.status !== "revoked" && (
                            <button
                              onClick={() => downloadSingle(c.id, c.certificateNumber)}
                              disabled={busy !== null}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-muted-foreground border border-border hover:bg-accent rounded-md transition-colors disabled:opacity-50"
                            >
                              {busy === `single-${c.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                              PDF
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "requests" && (
        <div className="space-y-3">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Requested</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Notes</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider w-44">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {data.requests.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12">
                        <EmptyState
                          icon={FileCheck}
                          title="No requests"
                          description="Certificate requests from members will appear here for review."
                        />
                      </td>
                    </tr>
                  )}
                  {data.requests.map((r) => (
                    <tr key={r.id} className="hover:bg-primary-light/30 transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-sm font-semibold text-foreground">{r.memberName}</p>
                        <p className="text-[10px] text-muted-foreground">{r.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{r.batch ?? "—"}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(r.requestDate)}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground max-w-[180px] truncate">{r.notes ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${getStatusStyle(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {r.status === "pending" && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => resolveRequest(r.id, "approve")}
                              disabled={busy !== null}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-[10px] font-bold text-white bg-primary hover:bg-primary-hover rounded-md transition-colors disabled:opacity-50"
                            >
                              {busy === `request-approve-${r.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              Approve
                            </button>
                            <button
                              onClick={() => setRejectTarget({ kind: "request", id: r.id })}
                              disabled={busy !== null}
                              className="px-2.5 py-1.5 text-[10px] font-bold text-destructive border border-destructive/20 hover:bg-destructive-bg rounded-md transition-colors disabled:opacity-50"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Reject / resolve dialog */}
      <ConfirmDialog
        open={rejectTarget !== null}
        onClose={() => { setRejectTarget(null); setRejectRemarks(""); }}
        onConfirm={() =>
          rejectTarget?.kind === "certificate"
            ? rejectCertificate(rejectTarget.id)
            : rejectTarget?.kind === "request"
              ? resolveRequest(rejectTarget.id, "reject")
              : undefined
        }
        title={rejectTarget?.kind === "request" ? "Reject certificate request?" : "Reject certificate?"}
        description={
          rejectTarget?.kind === "request"
            ? "The member's request will be marked as rejected and no certificate will be issued."
            : "This will void the certificate and reset the member's enrollment so it can be regenerated."
        }
        confirmLabel="Reject"
      >
        <div>
          <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
            Remarks (optional)
          </label>
          <textarea
            value={rejectRemarks}
            onChange={(e) => setRejectRemarks(e.target.value)}
            rows={2}
            placeholder="Reason for rejection..."
            className="w-full text-xs border border-border rounded-lg px-3 py-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </ConfirmDialog>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-xl font-bold text-foreground">{value.toLocaleString()}</p>
    </div>
  );
}
