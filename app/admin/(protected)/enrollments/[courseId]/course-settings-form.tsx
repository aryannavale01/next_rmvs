"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Save, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { requireStepUpClient, isStepUpRequiredResponse, redirectToStepUp } from "@/lib/admin-stepup";

interface CourseSettingsData {
  title: string;
  category: string;
  categoryIsLegacy: boolean;
  duration: string;
  meta_description: string;
  start_date: string;
  end_date: string;
  seats_total: string;
  required_docs: string[];
  status: string;
  access_code_required: boolean;
  auto_approve: boolean;
}

// Must match VALID_CATEGORIES / STATUS_MAP in /api/admin/courses/[courseId]
const CATEGORIES = ["Agriculture", "Tech", "Healthcare", "Business"];
const STATUSES = ["Draft", "Published"];
const DOC_OPTIONS = ["Aadhaar", "PAN", "Ration Card", "Profile Photo"];

const STEP_UP_ACTION = "update_course";
const FETCH_TIMEOUT_MS = 15000;

export default function CourseSettingsForm({ courseId }: { courseId: string }) {
  const [data, setData] = useState<CourseSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/courses/${courseId}`, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
        if (!res.ok) {
          if (!cancelled) setError("Failed to load course settings");
          return;
        }
        const json = await res.json();
        const c = json.course;
        if (!c || cancelled) return;
        const legacyCategory = !CATEGORIES.includes(c.category);
        setData({
          title: c.title ?? "",
          category: c.category ?? "",
          categoryIsLegacy: legacyCategory,
          duration: c.duration ?? "",
          meta_description: c.meta_description ?? "",
          start_date: c.start_date ?? "",
          end_date: c.end_date ?? "",
          seats_total: c.seats_total != null ? String(c.seats_total) : "",
          required_docs: Array.isArray(c.required_docs) ? c.required_docs : [],
          status: c.status === "Published" ? "Published" : "Draft",
          access_code_required: Boolean(c.access_code_required),
          auto_approve: Boolean(c.auto_approve),
        });
      } catch {
        if (!cancelled) setError("Network error loading course settings");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [courseId, retryCount]);

  const updateField = <K extends keyof CourseSettingsData>(key: K, value: CourseSettingsData[K]) => {
    setData((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const toggleDoc = (doc: string) => {
    if (!data) return;
    const next = data.required_docs.includes(doc)
      ? data.required_docs.filter((d) => d !== doc)
      : [...data.required_docs, doc];
    updateField("required_docs", next);
  };

  const handleSave = async () => {
    if (!data || saving) return;
    if (!(await requireStepUpClient(`/admin/enrollments/${courseId}`, STEP_UP_ACTION))) return;
    setSaving(true);
    setError(null);
    try {
      // Category is only sent when it holds a server-recognized value; legacy
      // enum categories are omitted until the admin explicitly picks one.
      const categoryToSend = CATEGORIES.includes(data.category) ? data.category : undefined;
      const seats = data.seats_total.trim();
      const payload: Record<string, unknown> = {
        title: data.title,
        duration: data.duration,
        meta_description: data.meta_description,
        start_date: data.start_date || "",
        end_date: data.end_date || "",
        required_docs: data.required_docs,
        status: data.status,
        access_code_required: data.access_code_required,
        auto_approve: data.auto_approve,
      };
      if (categoryToSend !== undefined) payload.category = categoryToSend;
      if (seats !== "") payload.seats_total = parseInt(seats, 10);

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        if (isStepUpRequiredResponse(res.status, json.error)) {
          redirectToStepUp(`/admin/enrollments/${courseId}`, STEP_UP_ACTION);
          return;
        }
        const message = json.error ?? "Failed to save settings";
        setError(message);
        toast({ title: "Save Failed", description: message, variant: "error" });
        return;
      }

      const json = await res.json().catch(() => ({}));
      toast({ title: "Settings Saved", description: "Course settings updated successfully.", variant: "success" });
      if (json.course) {
        const c = json.course;
        setData((prev) => prev ? ({
          ...prev,
          title: c.title ?? prev.title,
          category: c.category ?? prev.category,
          categoryIsLegacy: !CATEGORIES.includes(c.category ?? ""),
          duration: c.duration ?? prev.duration,
          meta_description: c.meta_description ?? "",
          start_date: c.start_date ?? "",
          end_date: c.end_date ?? "",
          seats_total: c.seats_total != null ? String(c.seats_total) : prev.seats_total,
          status: c.status === "Published" ? "Published" : "Draft",
          access_code_required: Boolean(c.access_code_required),
          auto_approve: Boolean(c.auto_approve),
        }) : prev);
      }
      setError(null);
    } catch (err) {
      const message = err instanceof DOMException && err.name === "TimeoutError"
        ? "The server took too long to respond. Please try again."
        : "Network error";
      setError(message);
      toast({ title: "Save Failed", description: message, variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-xl p-12 text-center">
        <Loader2 className="w-6 h-6 text-muted-foreground animate-spin mx-auto" />
        <p className="text-xs text-muted-foreground mt-3">Loading settings...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-card border border-border rounded-xl p-8 text-center">
        <AlertTriangle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">{error ?? "Course not found"}</p>
        <button onClick={() => setRetryCount((c) => c + 1)} className="mt-3 px-3 py-1.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-[10px] text-red-700">{error}</p>
        </div>
      )}

      {/* 1. Basic Info */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Basic Info</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Title</label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => updateField("title", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Category</label>
            <select
              value={data.category}
              onChange={(e) => updateField("category", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {!CATEGORIES.includes(data.category) && (
                <option value={data.category}>{data.category} (legacy — please change)</option>
              )}
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-span-1">
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Duration</label>
            <input
              type="text"
              value={data.duration}
              onChange={(e) => updateField("duration", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="col-span-2">
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Description</label>
            <textarea
              rows={3}
              value={data.meta_description}
              onChange={(e) => updateField("meta_description", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Schedule */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Schedule</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Start Date</label>
            <input
              type="date"
              value={data.start_date?.split("T")[0] ?? ""}
              onChange={(e) => updateField("start_date", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">End Date</label>
            <input
              type="date"
              value={data.end_date?.split("T")[0] ?? ""}
              onChange={(e) => updateField("end_date", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* 3. Capacity */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Capacity</h3>
        <div>
          <label className="text-[10px] font-medium text-muted-foreground block mb-1">Total Seats</label>
          <input
            type="number"
            min={0}
            value={data.seats_total}
            onChange={(e) => updateField("seats_total", e.target.value)}
            className="w-full max-w-[200px] px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <p className="text-[9px] text-muted-foreground mt-1">
            Reducing below currently filled seats (reserved + enrolled) will be blocked.
          </p>
        </div>
      </div>

      {/* 4. Required Documents */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Required Documents</h3>
        <div className="flex flex-wrap gap-2">
          {DOC_OPTIONS.map((doc) => {
            const isSelected = data.required_docs.includes(doc);
            return (
              <button
                key={doc}
                onClick={() => toggleDoc(doc)}
                className={`px-3 py-1.5 text-[10px] font-medium rounded-lg border transition-colors ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {doc}
              </button>
            );
          })}
        </div>
        <p className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Changes apply to new document reviews, not already-verified applications.
        </p>
      </div>

      {/* 5. Status */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Status</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Publish Status</label>
            <select
              value={data.status}
              onChange={(e) => updateField("status", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 6. Access */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Access</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.access_code_required}
              onChange={(e) => updateField("access_code_required", e.target.checked)}
              className="rounded border-border"
            />
            <div>
              <p className="text-xs font-medium text-foreground">Require access code to apply</p>
              <p className="text-[9px] text-muted-foreground">Only users with a valid access code can submit applications</p>
            </div>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.auto_approve}
              onChange={(e) => updateField("auto_approve", e.target.checked)}
              className="rounded border-border"
            />
            <div>
              <p className="text-xs font-medium text-foreground">Auto-approve applications</p>
              <p className="text-[9px] text-muted-foreground">Applications are automatically approved without manual review</p>
            </div>
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </div>
  );
}
