"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ArrowLeft,
  Users,
  BarChart3,
  List,
  Clock,
  Download,
  Settings,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  AlertTriangle,
  Trash2,
  Edit3,
  CheckCircle2,
  XCircle,
  ArrowUpCircle,
  FileText,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const STATUS_BAR_COLORS = ["#94a3b8", "#3b82f6", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#64748b"];
const ENROLLMENT_COLORS: Record<string, string> = {
  enrolled: "#3b82f6",
  in_progress: "#6366f1",
  completed: "#10b981",
  dropped: "#ef4444",
  certified: "#8b5cf6",
};

const ENROLLMENT_ACTION = 'manage_enrollments';

import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import HealthBadge from "@/components/enrollment-health-badge";
import EnrollmentMemberDrawer from "@/components/enrollment-member-drawer";
import EnrollmentBulkPreview from "@/components/enrollment-bulk-preview";
import EnrollmentExportModal from "@/components/enrollment-export-modal";
import {
  exportEnrollmentsPdf,
  exportEnrollmentsDocx,
  type EnrollmentExportRow,
  type ExportMetadata,
} from "@/lib/enrollment-export";
import CourseSettingsForm from "./course-settings-form";
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from "@/lib/admin-stepup";

type Tab = "applications" | "enrollments" | "waitlist" | "analytics" | "export" | "settings";

const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
  { key: "applications", label: "Applications", icon: List },
  { key: "enrollments", label: "Enrollments", icon: Users },
  { key: "waitlist", label: "Waitlist", icon: Clock },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "export", label: "Export", icon: Download },
  { key: "settings", label: "Settings", icon: Settings },
];

interface ApplicationRow {
  id: string;
  status: string;
  appliedDate: string;
  seatReservedAt: string | null;
  waitlistedAt: string | null;
  convertedAt: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
  member: { id: string; name: string; email: string; phone: string; district: string };
  course: { id: string; title: string; category: string; seatsTotal: number };
  noteCount: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CourseInfo {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  seatsTotal: number;
  totalApplications: number;
  totalEnrolled: number;
  seatInfo: { capacity: number; reserved: number; enrolled: number; available: number; waitlistCount: number } | null;
}

interface AnalyticsData {
  course: {
    id: string; title: string; category: string; level: string; duration: string;
    description: string | null; seatsTotal: number | null; startDate: string | null; endDate: string | null;
  };
  overview: { totalApplications: number; seatInfo: { capacity: number; reserved: number; enrolled: number; available: number; waitlistCount: number }; conversionRate: number };
  statusBreakdown: { status: string; count: number; percentage: number }[];
  enrollmentStatusBreakdown: { status: string; count: number }[];
  health: { overall: "healthy" | "warning" | "critical"; score: number; factors: unknown[] };
  documentsUploaded: number;
}

export default function TrainingWorkspacePage({ params }: { params: Promise<{ courseId: string }> }) {
  const [courseId, setCourseId] = useState<string>("");
  const [activeTab, setActiveTab] = useState<Tab>("applications");
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<{ overall: "healthy" | "warning" | "critical"; score: number; factors: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [drawerAppId, setDrawerAppId] = useState<string | null>(null);
  const [bulkPreviewOpen, setBulkPreviewOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<"approve" | "waitlist" | "reject" | "convert" | "promote" | "move_to_review" | "remove" | "bulk_drop" | "bulk_complete">("approve");
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const [drawerInitialTab, setDrawerInitialTab] = useState<"overview" | "documents">("overview");

  const [confirmReject, setConfirmReject] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmDrop, setConfirmDrop] = useState<string | null>(null);
  const [confirmComplete, setConfirmComplete] = useState<string | null>(null);
  const [confirmPromote, setConfirmPromote] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<string | null>(null);
  const [confirmMoveReview, setConfirmMoveReview] = useState<string | null>(null);

  const [editingEnrollment, setEditingEnrollment] = useState<string | null>(null);
  const [editBatch, setEditBatch] = useState("");
  const [editSeat, setEditSeat] = useState("");

  const [enrolledList, setEnrolledList] = useState<{
    id: string;
    status: string;
    enrollmentDate: string;
    attendance: number;
    batchLabel: string | null;
    seatNumber: number | null;
    startedAt: string | null;
    completionDate: string | null;
    member: { id: string; name: string; email: string; phone: string; district: string };
  }[]>([]);
  const [enrolledPagination, setEnrolledPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [enrolledSearch, setEnrolledSearch] = useState("");
  const [enrolledStatusFilter, setEnrolledStatusFilter] = useState("");

  useEffect(() => {
    params.then((p) => setCourseId(p.courseId));
  }, [params]);

  const fetchApplications = useCallback(
    async (page = 1, status?: string, searchQuery?: string, sort?: string, order?: string) => {
      setLoading(true);
      const query = new URLSearchParams({
        courseId,
        page: page.toString(),
        limit: "20",
      });
      if (status) query.set("status", status);
      if (searchQuery) query.set("search", searchQuery);
      if (sort) query.set("sort", sort);
      if (order) query.set("order", order);

      try {
        const res = await fetch(`/api/admin/enrollments?${query}`);
        const data = await res.json();
        setApplications(data.data ?? []);
        setPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (err) {
        console.error('Failed to load applications:', err);
        setApplications([]);
        toast({ title: 'Error', description: 'Could not load applications.', variant: 'error' });
      } finally {
        setLoading(false);
      }
    },
    [courseId],
  );

  useEffect(() => {
    if (!courseId) return;
    const load = async () => {
      await fetchApplications(1, statusFilter || undefined, search || undefined);
      try {
        const res = await fetch(`/api/admin/enrollments/analytics?courseId=${courseId}`, { signal: AbortSignal.timeout(20000) });
        if (!res.ok) throw new Error(`Analytics failed (${res.status})`);
        const data = await res.json();
        const d = data.data;
        if (d?.course) {
          setCourseInfo({
            id: d.course.id,
            title: d.course.title,
            category: d.course.category,
            level: d.course.level,
            duration: d.course.duration,
            seatsTotal: d.course.seatsTotal ?? 0,
            totalApplications: d.overview.totalApplications,
            totalEnrolled: d.overview.seatInfo.enrolled,
            seatInfo: d.overview.seatInfo ?? null,
          });
          setAnalyticsData(d);
        }
        setHealth(d?.health ?? null);
      } catch (err) { console.error('Failed to load course analytics:', err); toast({ title: 'Error', description: 'Could not load course analytics.', variant: 'error' }); }
    };
    load();
  }, [courseId]);

  const fetchEnrollments = useCallback(
    async (page = 1, searchQuery?: string, statusOverride?: string) => {
      setEnrolledLoading(true);
      const query = new URLSearchParams({ courseId, page: page.toString(), limit: "20" });
      if (searchQuery) query.set("search", searchQuery);
      const status = statusOverride !== undefined ? statusOverride : enrolledStatusFilter;
      if (status) query.set("status", status);
      try {
        const res = await fetch(`/api/admin/enrollments/enrolled?${query}`);
        const data = await res.json();
        setEnrolledList(data.data ?? []);
        setEnrolledPagination(data.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 });
      } catch (err) {
        console.error('Failed to fetch enrolled students:', err);
        setEnrolledList([]);
        toast({ title: 'Error', description: 'Could not load enrolled students.', variant: 'error' });
      } finally {
        setEnrolledLoading(false);
      }
    },
    [courseId, enrolledStatusFilter],
  );

  useEffect(() => {
    if (!courseId) return;
    if (activeTab === "enrollments") {
      const load = async () => { await fetchEnrollments(1, enrolledSearch || undefined); };
      load();
    }
    if (activeTab === "waitlist") {
      const load = async () => { await fetchApplications(1, "waitlisted", search || undefined, "waitlistedAt", "asc"); };
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, activeTab]);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    setSelectedIds(new Set());
    setEditingEnrollment(null);
    setActiveTab(tab);
  };

  const handlePageChange = (newPage: number) => {
    fetchApplications(newPage, statusFilter || undefined, search || undefined);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setSelectedIds(new Set());
    fetchApplications(1, status || undefined, search || undefined);
  };

  const toggleSelectAll = () => {
    if (activeTab === "enrollments") {
      if (selectedIds.size === enrolledList.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(enrolledList.map((e) => e.id)));
      }
    } else if (activeTab === "waitlist") {
      if (selectedIds.size === applications.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(applications.map((a) => a.id)));
      }
    } else {
      if (selectedIds.size === applications.length) {
        setSelectedIds(new Set());
      } else {
        setSelectedIds(new Set(applications.map((a) => a.id)));
      }
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = (action: "approve" | "waitlist" | "reject" | "convert" | "promote" | "move_to_review" | "remove" | "bulk_drop" | "bulk_complete") => {
    setBulkAction(action);
    setBulkPreviewOpen(true);
  };

  const confirmBulk = async () => {
    setIsProcessing(true);
    try {
      if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
      const isEnrollmentAction = bulkAction === "bulk_drop" || bulkAction === "bulk_complete";
      const res = await fetch("/api/admin/enrollments/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: bulkAction,
          ...(isEnrollmentAction
            ? { enrollmentIds: Array.from(selectedIds) }
            : { applicationIds: Array.from(selectedIds) }),
        }),
        signal: AbortSignal.timeout(15000),
      }).catch((err) => {
        if (err instanceof DOMException && err.name === "TimeoutError") throw new Error("The server took too long to respond. Please try again.");
        throw err;
      });
      if (!res.ok) {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Bulk Action Failed", description: data.error || "Could not run bulk action.", variant: "error" });
        return;
      }
      setBulkPreviewOpen(false);
      setSelectedIds(new Set());
      if (isEnrollmentAction) {
        fetchEnrollments(enrolledPagination.page, enrolledSearch || undefined);
      } else if (bulkAction === "promote" || bulkAction === "move_to_review" || bulkAction === "remove") {
        fetchApplications(1, "waitlisted", search || undefined, "waitlistedAt", "asc");
      } else {
        fetchApplications(pagination.page, statusFilter || undefined, search || undefined);
      }
    } catch (err) {
      toast({ title: "Bulk Action Failed", description: err instanceof Error && err.name !== "AbortError" ? err.message : "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!confirmReject) return;
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${confirmReject}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ status: "rejected", rejectionReason: rejectReason || undefined }),
      });
      if (res.ok) {
        toast({ title: "Application Rejected", description: "Application has been rejected.", variant: "success" });
        fetchApplications(pagination.page, statusFilter || undefined, search || undefined);
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Reject Failed", description: "Could not reject application.", variant: "error" });
      }
    } catch {
      toast({ title: "Reject Failed", description: "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
      setConfirmReject(null);
      setRejectReason("");
    }
  };

  const handleDrop = async () => {
    if (!confirmDrop) return;
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/enrollments/enrolled/${confirmDrop}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ status: "dropped" }),
      });
      if (res.ok) {
        toast({ title: "Enrollment Dropped", description: "Student has been dropped from the course.", variant: "success" });
        fetchEnrollments(enrolledPagination.page, enrolledSearch || undefined);
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Drop Failed", description: "Could not drop enrollment.", variant: "error" });
      }
    } catch {
      toast({ title: "Drop Failed", description: "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
      setConfirmDrop(null);
    }
  };

  const handleComplete = async () => {
    if (!confirmComplete) return;
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/enrollments/enrolled/${confirmComplete}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ status: "completed" }),
      });
      if (res.ok) {
        toast({ title: "Enrollment Completed", description: "Student has been marked as completed.", variant: "success" });
        fetchEnrollments(enrolledPagination.page, enrolledSearch || undefined);
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Complete Failed", description: "Could not mark as completed.", variant: "error" });
      }
    } catch {
      toast({ title: "Complete Failed", description: "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
      setConfirmComplete(null);
    }
  };

  const handlePromote = async () => {
    if (!confirmPromote) return;
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${confirmPromote}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ status: "seat_reserved" }),
      });
      if (res.ok) {
        toast({ title: "Promoted to Enrollment", description: "Application approved and enrollment created.", variant: "success" });
        if (activeTab === "waitlist") {
          fetchApplications(1, "waitlisted", search || undefined, "waitlistedAt", "asc");
        } else {
          fetchApplications(pagination.page, statusFilter || undefined, search || undefined);
        }
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Promote Failed", description: "Could not promote application.", variant: "error" });
      }
    } catch {
      toast({ title: "Promote Failed", description: "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
      setConfirmPromote(null);
    }
  };

  const handleRemove = async () => {
    if (!confirmRemove) return;
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${confirmRemove}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ status: "deleted" }),
      });
      if (res.ok) {
        toast({ title: "Removed from Waitlist", description: "Application has been removed.", variant: "success" });
        fetchApplications(1, "waitlisted", search || undefined, "waitlistedAt", "asc");
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Remove Failed", description: "Could not remove application.", variant: "error" });
      }
    } catch {
      toast({ title: "Remove Failed", description: "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
      setConfirmRemove(null);
    }
  };

  const handleMoveReview = async () => {
    if (!confirmMoveReview) return;
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/admin/enrollments/${confirmMoveReview}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ status: "under_review" }),
      });
      if (res.ok) {
        toast({ title: "Moved to Under Review", description: "Application moved back to review queue.", variant: "success" });
        fetchApplications(1, "waitlisted", search || undefined, "waitlistedAt", "asc");
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Move Failed", description: "Could not move application.", variant: "error" });
      }
    } catch {
      toast({ title: "Move Failed", description: "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
      setConfirmMoveReview(null);
    }
  };

  const handleSaveEnrollmentEdit = async (enrollmentId: string) => {
    const target = enrolledList.find((e) => e.id === enrollmentId);
    const batchChanged = editBatch !== (target?.batchLabel ?? "");
    const seatChanged = editSeat !== (target?.seatNumber?.toString() ?? "");
    if (!batchChanged && !seatChanged) {
      setEditingEnrollment(null);
      return;
    }
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION))) return;
    setIsProcessing(true);
    try {
      const body: Record<string, unknown> = {};
      if (editBatch) body.batchLabel = editBatch;
      if (editSeat) body.seatNumber = parseInt(editSeat, 10);
      const res = await fetch(`/api/admin/enrollments/enrolled/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: "Enrollment Updated", description: "Batch and seat info updated.", variant: "success" });
        setEditingEnrollment(null);
        fetchEnrollments(enrolledPagination.page, enrolledSearch || undefined);
      } else {
        const data = await res.json();
        if (isStepUpRequiredResponse(res.status, data.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId || ''}`, ENROLLMENT_ACTION);
          return;
        }
        toast({ title: "Update Failed", description: "Could not update enrollment.", variant: "error" });
      }
    } catch {
      toast({ title: "Update Failed", description: "Network error.", variant: "error" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = async (format: "csv" | "pdf" | "docx", scope: "all" | "selected") => {
    setExportModalOpen(false);
    if (format === "csv") {
      const query = new URLSearchParams({ format: "csv", courseId });
      if (statusFilter) query.set("status", statusFilter);
      window.open(`/api/admin/enrollments/export?${query}`, "_blank");
      return;
    }
    if (format === "pdf") {
      if (scope === "selected") {
        // Client-side PDF for small scope
        const query = new URLSearchParams({ format: "json-rich", courseId });
        if (statusFilter) query.set("status", statusFilter);
        const res = await fetch(`/api/admin/enrollments/export?${query}`);
        const json = await res.json();
        await exportEnrollmentsPdf(json.people ?? [], json.course, {
          generatedBy: json.metadata?.generatedBy ?? "Admin",
          role: "admin",
          generatedAt: new Date().toISOString(),
          version: process.env.NEXT_PUBLIC_APP_VERSION ?? "0.1.0",
          totalRecords: (json.people ?? []).length,
          filters: { courseId, status: statusFilter ?? "all" },
        });
      } else {
        // Server-side PDF for all scope
        setIsProcessing(true);
        try {
          const res = await fetch("/api/admin/enrollments/export-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ courseId, scope: "all" }),
          });
          if (!res.ok) {
            const err = await res.json();
            toast({ title: "Export Failed", description: err.error ?? "Unknown error", variant: "error" });
            return;
          }
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `enrollment-export-${new Date().toISOString().split("T")[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
        } catch {
          toast({ title: "Export Failed", description: "Network error", variant: "error" });
        } finally {
          setIsProcessing(false);
        }
      }
      return;
    }
    // DOCX stays on the old path
    const query = new URLSearchParams({ format: "json", courseId });
    if (statusFilter) query.set("status", statusFilter);
    const res = await fetch(`/api/admin/enrollments/export?${query}`);
    const json = await res.json();
    const rows: EnrollmentExportRow[] = json.data ?? [];
    const meta: ExportMetadata = json.metadata ?? {
      generatedBy: "Admin",
      role: "admin",
      generatedAt: new Date().toISOString(),
      version: "0.1.0",
      totalRecords: rows.length,
      filters: { courseId, status: statusFilter ?? "all" },
    };
    await exportEnrollmentsDocx(rows, meta);
  };

  return (
    <div className="space-y-4 font-sans">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/enrollments" className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-foreground">
            {courseInfo?.title ?? "Training Workspace"}
          </h1>
          <p className="text-[10px] text-muted-foreground">
            {courseInfo?.category} · {courseInfo?.level} · {courseInfo?.duration}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "applications" && (
        <div className="space-y-3">
          {/* Search + Filters */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchApplications(1, statusFilter || undefined, search)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["", "pending", "under_review", "documents_verified", "seat_reserved", "waitlisted", "rejected"].map((s) => (
                <button
                  key={s}
                  onClick={() => handleStatusFilter(s)}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                    statusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <p className="text-xs font-medium text-primary">{selectedIds.size} selected</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulkAction("approve")} className="px-3 py-1.5 text-[10px] font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                  Approve
                </button>
                <button onClick={() => handleBulkAction("waitlist")} className="px-3 py-1.5 text-[10px] font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors">
                  Waitlist
                </button>
                <button onClick={() => handleBulkAction("reject")} className="px-3 py-1.5 text-[10px] font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Reject
                </button>
                <button onClick={() => handleBulkAction("convert")} className="px-3 py-1.5 text-[10px] font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Convert
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === applications.length && applications.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applied</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <p className="text-xs text-muted-foreground">No applications found</p>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app) => (
                      <tr key={app.id} className="hover:bg-primary-light/30 transition-colors">
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelect(app.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-foreground">{app.member.name}</p>
                          <p className="text-[10px] text-muted-foreground">{app.member.email}</p>
                          <p className="text-[10px] text-muted-foreground">{app.member.district}</p>
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[10px] text-muted-foreground">{app.appliedDate}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {(app.status === "pending" || app.status === "under_review") && (
                              <button
                                onClick={() => { setDrawerAppId(app.id); setDrawerInitialTab("documents"); }}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                <FileText className="w-3 h-3" />
                                Docs
                              </button>
                            )}
                            {app.status === "documents_verified" && (
                              <button
                                onClick={() => setConfirmPromote(app.id)}
                                disabled={courseInfo?.seatInfo != null && courseInfo.seatInfo.available === 0}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={courseInfo?.seatInfo != null && courseInfo.seatInfo.available === 0 ? "No seats available" : undefined}
                              >
                                <CheckCircle2 className="w-3 h-3" />
                                Enroll
                              </button>
                            )}
                            {app.status === "waitlisted" && (
                              <button
                                onClick={() => setConfirmPromote(app.id)}
                                disabled={courseInfo?.seatInfo != null && courseInfo.seatInfo.available === 0}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={courseInfo?.seatInfo != null && courseInfo.seatInfo.available === 0 ? "No seats available" : undefined}
                              >
                                <ArrowUpCircle className="w-3 h-3" />
                                Promote
                              </button>
                            )}
                            {!["seat_reserved", "rejected", "deleted"].includes(app.status) && (
                              <button
                                onClick={() => setConfirmReject(app.id)}
                                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                              >
                                <XCircle className="w-3 h-3" />
                                Reject
                              </button>
                            )}
                            <button
                              onClick={() => { setDrawerAppId(app.id); setDrawerInitialTab("overview"); }}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, pagination.page - 2);
                    const p = start + i;
                    if (p > pagination.totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        className={`w-7 h-7 text-[10px] font-medium rounded-lg transition-colors ${
                          p === pagination.page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "enrollments" && (
        <div className="space-y-3">
          {/* Search + Filters */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={enrolledSearch}
                onChange={(e) => setEnrolledSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchEnrollments(1, enrolledSearch)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {["", "enrolled", "in_progress", "completed", "dropped", "certified"].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setEnrolledStatusFilter(s);
                    fetchEnrollments(1, enrolledSearch || undefined, s);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-medium rounded-full border transition-colors ${
                    enrolledStatusFilter === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {s || "All"}
                </button>
              ))}
            </div>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <p className="text-xs font-medium text-primary">{selectedIds.size} selected</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulkAction("bulk_complete")} className="px-3 py-1.5 text-[10px] font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                  Mark Completed
                </button>
                <button onClick={() => handleBulkAction("bulk_drop")} className="px-3 py-1.5 text-[10px] font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Drop
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === enrolledList.length && enrolledList.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Enrolled</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Attendance</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Batch</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Seat</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {enrolledLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : enrolledList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center">
                        <p className="text-xs text-muted-foreground">No enrollments found</p>
                      </td>
                    </tr>
                  ) : (
                    enrolledList.map((enr) => (
                      <tr key={enr.id} className="hover:bg-primary-light/30 transition-colors">
                        <td className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(enr.id)}
                            onChange={() => toggleSelect(enr.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-foreground">{enr.member.name}</p>
                          <p className="text-[10px] text-muted-foreground">{enr.member.email}</p>
                          <p className="text-[10px] text-muted-foreground">{enr.member.district}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                              enr.status === "enrolled"
                                ? "bg-emerald-100 text-emerald-700"
                                : enr.status === "in_progress"
                                  ? "bg-blue-100 text-blue-700"
                                  : enr.status === "completed"
                                    ? "bg-purple-100 text-purple-700"
                                    : enr.status === "dropped"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {enr.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[10px] text-muted-foreground">{enr.enrollmentDate}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[10px] text-muted-foreground">{enr.attendance}%</p>
                        </td>
                        <td className="px-4 py-3">
                          {editingEnrollment === enr.id ? (
                            <input
                              type="text"
                              value={editBatch}
                              onChange={(e) => setEditBatch(e.target.value)}
                              className="w-full px-2 py-1 text-[10px] border border-border rounded bg-background text-foreground"
                            />
                          ) : (
                            <p className="text-[10px] text-muted-foreground">{enr.batchLabel ?? "—"}</p>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingEnrollment === enr.id ? (
                            <input
                              type="number"
                              value={editSeat}
                              onChange={(e) => setEditSeat(e.target.value)}
                              className="w-16 px-2 py-1 text-[10px] border border-border rounded bg-background text-foreground"
                            />
                          ) : (
                            <p className="text-[10px] text-muted-foreground">{enr.seatNumber ?? "—"}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {editingEnrollment === enr.id ? (
                              <>
                                <button
                                  onClick={() => handleSaveEnrollmentEdit(enr.id)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors"
                                >
                                  <CheckCircle2 className="w-3 h-3" />
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingEnrollment(null)}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <>
                                {(enr.status === "enrolled" || enr.status === "in_progress") && (
                                  <>
                                    <button
                                      onClick={() => setConfirmComplete(enr.id)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      Done
                                    </button>
                                    <button
                                      onClick={() => setConfirmDrop(enr.id)}
                                      className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                      Drop
                                    </button>
                                  </>
                                )}
                                <button
                                  onClick={() => { setEditingEnrollment(enr.id); setEditBatch(enr.batchLabel ?? ""); setEditSeat(enr.seatNumber?.toString() ?? ""); }}
                                  className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  Edit
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {enrolledPagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  Showing {(enrolledPagination.page - 1) * enrolledPagination.limit + 1}–
                  {Math.min(enrolledPagination.page * enrolledPagination.limit, enrolledPagination.total)} of {enrolledPagination.total}
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => fetchEnrollments(enrolledPagination.page - 1, enrolledSearch || undefined)}
                    disabled={enrolledPagination.page <= 1}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(enrolledPagination.totalPages, 5) }, (_, i) => {
                    const start = Math.max(1, enrolledPagination.page - 2);
                    const p = start + i;
                    if (p > enrolledPagination.totalPages) return null;
                    return (
                      <button
                        key={p}
                        onClick={() => fetchEnrollments(p, enrolledSearch || undefined)}
                        className={`w-7 h-7 text-[10px] font-medium rounded-lg transition-colors ${
                          p === enrolledPagination.page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => fetchEnrollments(enrolledPagination.page + 1, enrolledSearch || undefined)}
                    disabled={enrolledPagination.page >= enrolledPagination.totalPages}
                    className="p-1 rounded hover:bg-muted disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "waitlist" && (
        <div className="space-y-3">
          {/* Seat availability banner */}
          {courseInfo?.seatInfo && (
            <div className={`rounded-xl p-4 flex items-center gap-3 ${courseInfo.seatInfo.available === 0 ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}>
              {courseInfo.seatInfo.available === 0
                ? <AlertTriangle className="w-5 h-5 text-red-500" />
                : <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              }
              <div>
                <p className={`text-xs font-bold ${courseInfo.seatInfo.available === 0 ? "text-red-700" : "text-emerald-700"}`}>
                  {courseInfo.seatInfo.available} of {courseInfo.seatInfo.capacity} seats available
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {courseInfo.seatInfo.enrolled} enrolled · {courseInfo.seatInfo.reserved} reserved · {courseInfo.seatInfo.waitlistCount} waitlisted
                </p>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">
              {pagination.total} waitlisted application{pagination.total !== 1 ? "s" : ""} — ordered by waitlist position (earliest first)
            </p>
          </div>

          {/* Bulk action bar */}
          {selectedIds.size > 0 && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center justify-between">
              <p className="text-xs font-medium text-primary">{selectedIds.size} selected</p>
              <div className="flex items-center gap-2">
                <button onClick={() => handleBulkAction("promote")} className="px-3 py-1.5 text-[10px] font-medium bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
                  Promote
                </button>
                <button onClick={() => handleBulkAction("move_to_review")} className="px-3 py-1.5 text-[10px] font-medium bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Move to Review
                </button>
                <button onClick={() => handleBulkAction("reject")} className="px-3 py-1.5 text-[10px] font-medium bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                  Reject
                </button>
                <button onClick={() => handleBulkAction("remove")} className="px-3 py-1.5 text-[10px] font-medium bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  Remove
                </button>
                <button onClick={() => setSelectedIds(new Set())} className="px-3 py-1.5 text-[10px] font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors">
                  Clear
                </button>
              </div>
            </div>
          )}

          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-background border-b border-border">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === applications.length && applications.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">#</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Member</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Applied</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Waitlisted</th>
                    <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin mx-auto" />
                      </td>
                    </tr>
                  ) : applications.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center">
                        <p className="text-xs text-muted-foreground">No waitlisted applications</p>
                      </td>
                    </tr>
                  ) : (
                    applications.map((app, idx) => (
                      <tr key={app.id} className="hover:bg-primary-light/30 transition-colors">
                        <td className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(app.id)}
                            onChange={() => toggleSelect(app.id)}
                            className="rounded border-border"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs font-bold text-foreground">{idx + 1}</span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-xs font-semibold text-foreground">{app.member.name}</p>
                          <p className="text-[10px] text-muted-foreground">{app.member.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[10px] text-muted-foreground">{app.appliedDate}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[10px] text-muted-foreground">{app.waitlistedAt ?? "—"}</p>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setConfirmPromote(app.id)}
                              disabled={courseInfo?.seatInfo != null && courseInfo.seatInfo.available === 0}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              title={courseInfo?.seatInfo != null && courseInfo.seatInfo.available === 0 ? "No seats available" : undefined}
                            >
                              <ArrowUpCircle className="w-3 h-3" />
                              Promote
                            </button>
                            <button
                              onClick={() => setConfirmMoveReview(app.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                            >
                              <Filter className="w-3 h-3" />
                              Review
                            </button>
                            <button
                              onClick={() => setConfirmReject(app.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                            <button
                              onClick={() => setConfirmRemove(app.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-red-800 bg-red-100 border border-red-300 rounded-lg hover:bg-red-200 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && analyticsData && (
        <div className="space-y-4">
          {/* Application Funnel */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Application Funnel</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={analyticsData.statusBreakdown} layout="vertical" margin={{ left: 100, right: 20 }}>
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="status" tick={{ fontSize: 9 }} width={90} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 6 }}
                  formatter={(value) => [value, "Count"] as [string, string]}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {analyticsData.statusBreakdown.map((entry, idx) => (
                    <Cell key={entry.status} fill={STATUS_BAR_COLORS[idx % STATUS_BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Enrollment Status Breakdown */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Enrollment Status Breakdown</h3>
            {analyticsData.enrollmentStatusBreakdown.length > 0 ? (
              <div className="flex items-center gap-8">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie
                      data={analyticsData.enrollmentStatusBreakdown}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {analyticsData.enrollmentStatusBreakdown.map((entry) => (
                        <Cell key={entry.status} fill={ENROLLMENT_COLORS[entry.status] ?? "#94a3b8"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 6 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5">
                  {analyticsData.enrollmentStatusBreakdown.map((entry) => (
                    <div key={entry.status} className="flex items-center gap-2 text-[10px]">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: ENROLLMENT_COLORS[entry.status] ?? "#94a3b8" }}
                      />
                      <span className="text-muted-foreground capitalize">{entry.status.replace(/_/g, " ")}</span>
                      <span className="font-semibold text-foreground">{entry.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[10px] text-muted-foreground">No enrollment records yet</p>
            )}
          </div>

          {/* Seat Utilization */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Seat Utilization</h3>
            {(() => {
              const si = analyticsData.overview.seatInfo;
              const total = si.capacity || si.reserved + si.enrolled + si.available || 1;
              const filled = si.reserved + si.enrolled;
              const filledPct = Math.round((filled / total) * 100);
              const availablePct = Math.round((si.available / total) * 100);
              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-muted-foreground">Capacity: <strong className="text-foreground">{si.capacity}</strong></span>
                    <span className="text-emerald-600">Filled: <strong>{filled}</strong></span>
                    <span className="text-blue-600">Available: <strong>{si.available}</strong></span>
                    {si.waitlistCount > 0 && (
                      <span className="text-amber-600">Waitlisted: <strong>{si.waitlistCount}</strong></span>
                    )}
                  </div>
                  <div className="w-full h-4 bg-muted rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all"
                      style={{ width: `${filledPct}%` }}
                    />
                    <div
                      className="h-full bg-blue-400 transition-all"
                      style={{ width: `${availablePct}%` }}
                    />
                  </div>
                  <div className="flex gap-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-500" /> Filled ({filledPct}%)</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-400" /> Available ({availablePct}%)</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Health Section */}
          {health && (
            <div className="bg-card border border-border rounded-xl p-6">
              <HealthBadge overall={health.overall} score={health.score} size="md" />
              <div className="mt-4 space-y-3">
                {(health.factors as { name: string; status: string; value: number; threshold: number; message: string }[]).map(
                  (factor) => (
                    <div key={factor.name} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{factor.name}</p>
                        <p className="text-[10px] text-muted-foreground">{factor.message}</p>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                          factor.status === "good"
                            ? "bg-emerald-100 text-emerald-700"
                            : factor.status === "warning"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {factor.value} (threshold: {factor.threshold})
                      </span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "export" && (
        <div className="bg-card border border-border rounded-xl p-8 text-center">
          <Download className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">Export Data</p>
          <p className="text-[10px] text-muted-foreground mt-1 mb-4">Export enrollment data in CSV, PDF, or DOCX format</p>
          <button
            onClick={() => setExportModalOpen(true)}
            className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
          >
            Open Export
          </button>
        </div>
      )}

      {activeTab === "settings" && (
        <CourseSettingsForm courseId={courseId} />
      )}

      {/* Drawers & Modals */}
      <EnrollmentMemberDrawer
        isOpen={drawerAppId !== null}
        onClose={() => setDrawerAppId(null)}
        applicationId={drawerAppId}
        initialTab={drawerInitialTab}
        seatInfo={courseInfo?.seatInfo ? { available: courseInfo.seatInfo.available, isFull: courseInfo.seatInfo.available === 0 } : undefined}
        onActionComplete={() => {
          if (activeTab === "applications") fetchApplications(pagination.page, statusFilter || undefined, search || undefined);
          else if (activeTab === "enrollments") fetchEnrollments(enrolledPagination.page, enrolledSearch || undefined);
          else if (activeTab === "waitlist") fetchApplications(1, "waitlisted", search || undefined, "waitlistedAt", "asc");
        }}
      />
      <EnrollmentBulkPreview
        isOpen={bulkPreviewOpen}
        onClose={() => setBulkPreviewOpen(false)}
        action={bulkAction}
        items={(() => {
          const needsSeat = bulkAction === "approve" || bulkAction === "promote";
          let allocated = 0;
          const available = courseInfo?.seatInfo?.available ?? 0;
          return Array.from(selectedIds).map((id) => {
            if (bulkAction === "bulk_drop" || bulkAction === "bulk_complete") {
              const enr = enrolledList.find((e) => e.id === id);
              return {
                applicationId: id,
                memberName: enr?.member.name ?? "",
                courseTitle: courseInfo?.title ?? "",
                currentStatus: enr?.status ?? "",
                targetStatus: bulkAction === "bulk_drop" ? "dropped" : "completed",
                canProceed: true,
                reason: "",
              };
            }
            const app = applications.find((a) => a.id === id);
            const targetMap: Record<string, string> = {
              approve: "seat_reserved",
              waitlist: "waitlisted",
              reject: "rejected",
              convert: "enrolled",
              promote: "seat_reserved",
              move_to_review: "under_review",
              remove: "deleted",
            };
            let canProceed = true;
            let reason = "";
            let targetStatus = targetMap[bulkAction] ?? bulkAction;
            if (needsSeat) {
              if (allocated < available) {
                allocated++;
              } else {
                canProceed = false;
                targetStatus = "waitlisted";
                reason = "No seats available — will be auto-waitlisted";
              }
            }
            return {
              applicationId: id,
              memberName: app?.member.name ?? "",
              courseTitle: app?.course.title ?? "",
              currentStatus: app?.status ?? "",
              targetStatus,
              canProceed,
              reason,
            };
          });
        })()}
        onConfirm={confirmBulk}
        isProcessing={isProcessing}
      />
      <EnrollmentExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        courseId={courseId}
        status={statusFilter || undefined}
        selectedCount={selectedIds.size}
        totalCount={courseInfo?.totalApplications ?? 0}
        onExport={handleExport}
      />

      {/* Confirm Dialogs */}
      <ConfirmDialog
        key={confirmReject ? `reject-${confirmReject}` : "reject-closed"}
        open={!!confirmReject}
        onClose={() => { setConfirmReject(null); setRejectReason(""); }}
        onConfirm={handleReject}
        title="Reject Application"
        description="Are you sure you want to reject this application? This action cannot be undone."
        confirmLabel="Reject"
      >
        <input
          type="text"
          placeholder="Rejection reason (optional)"
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary mt-3"
        />
      </ConfirmDialog>

      <ConfirmDialog
        key={confirmDrop ? `drop-${confirmDrop}` : "drop-closed"}
        open={!!confirmDrop}
        onClose={() => setConfirmDrop(null)}
        onConfirm={handleDrop}
        title="Drop Enrollment"
        description="Are you sure you want to drop this student from the course? This will mark their enrollment as dropped."
        confirmLabel="Drop"
      />

      <ConfirmDialog
        key={confirmComplete ? `complete-${confirmComplete}` : "complete-closed"}
        open={!!confirmComplete}
        onClose={() => setConfirmComplete(null)}
        onConfirm={handleComplete}
        title="Mark as Completed"
        description="Mark this student's enrollment as completed. This will record today as their completion date."
        confirmLabel="Mark Completed"
        variant="primary"
      />

      <ConfirmDialog
        key={confirmPromote ? `promote-${confirmPromote}` : "promote-closed"}
        open={!!confirmPromote}
        onClose={() => setConfirmPromote(null)}
        onConfirm={handlePromote}
        title="Promote to Enrollment"
        description="This will approve the application and create an enrollment record. A seat will be reserved for this student."
        confirmLabel="Confirm"
        variant="primary"
      />

      <ConfirmDialog
        key={confirmRemove ? `remove-${confirmRemove}` : "remove-closed"}
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        onConfirm={handleRemove}
        title="Remove from Waitlist"
        description="This will permanently remove the application from the waitlist. The record will not appear in any tab."
        confirmLabel="Remove"
      />

      <ConfirmDialog
        key={confirmMoveReview ? `review-${confirmMoveReview}` : "review-closed"}
        open={!!confirmMoveReview}
        onClose={() => setConfirmMoveReview(null)}
        onConfirm={handleMoveReview}
        title="Move to Under Review"
        description="Move this application back to the review queue. This will clear their waitlist position."
        confirmLabel="Move to Review"
        variant="primary"
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const STYLES: Record<string, string> = {
    pending: "bg-gray-100 text-gray-600",
    under_review: "bg-blue-100 text-blue-600",
    documents_verified: "bg-indigo-100 text-indigo-600",
    seat_reserved: "bg-emerald-100 text-emerald-600",
    waitlisted: "bg-amber-100 text-amber-600",
    rejected: "bg-red-100 text-red-600",
  };

  return (
    <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide rounded-full ${STYLES[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}
