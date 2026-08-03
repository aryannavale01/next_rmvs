"use client";

import React, { useState, useEffect } from "react";
import { Loader2, Save, X, Plus, AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface CourseSettingsData {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string;
  seatsTotal: number | null;
  startDate: string | null;
  endDate: string | null;
  requiredDocuments: string[];
  status: string;
  visibility: string;
  accessCodeRequired: boolean;
  autoApprove: boolean;
}

const CATEGORIES = ["health", "tech", "leadership", "environment"];
const LEVELS = ["beginner", "intermediate", "advanced"];
const STATUSES = ["draft", "active", "archived"];
const VISIBILITIES = ["homepage", "programs", "both"];
const DOC_OPTIONS = ["aadhaar", "pan", "rationCard", "profilePhoto"];

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
        const res = await fetch(`/api/admin/courses/${courseId}`);
        if (!res.ok) {
          if (!cancelled) setError("Failed to load course settings");
          return;
        }
        const json = await res.json();
        if (!cancelled) setData(json.course);
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
    const current = data.requiredDocuments;
    const next = current.includes(doc) ? current.filter((d) => d !== doc) : [...current, doc];
    updateField("requiredDocuments", next);
  };

  const handleSave = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {
        title: data.title,
        category: data.category,
        level: data.level,
        duration: data.duration,
        description: data.description,
        seatsTotal: data.seatsTotal,
        startDate: data.startDate,
        endDate: data.endDate,
        requiredDocuments: data.requiredDocuments,
        status: data.status,
        visibility: data.visibility,
        accessCodeRequired: data.accessCodeRequired,
        autoApprove: data.autoApprove,
      };

      const res = await fetch(`/api/admin/courses/${courseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error ?? "Failed to save");
        toast({ title: "Save Failed", description: json.error ?? "Unknown error", variant: "error" });
        return;
      }

      toast({ title: "Settings Saved", description: "Course settings updated successfully.", variant: "success" });
      setData(json.course);
      setError(null);
    } catch {
      setError("Network error");
      toast({ title: "Save Failed", description: "Network error", variant: "error" });
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
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Level</label>
            <select
              value={data.level}
              onChange={(e) => updateField("level", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
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
              value={data.description}
              onChange={(e) => updateField("description", e.target.value)}
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
              value={data.startDate?.split("T")[0] ?? ""}
              onChange={(e) => updateField("startDate", e.target.value ? e.target.value : null)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">End Date</label>
            <input
              type="date"
              value={data.endDate?.split("T")[0] ?? ""}
              onChange={(e) => updateField("endDate", e.target.value ? e.target.value : null)}
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
            value={data.seatsTotal ?? ""}
            onChange={(e) => updateField("seatsTotal", e.target.value ? parseInt(e.target.value, 10) : null)}
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
            const isSelected = data.requiredDocuments.includes(doc);
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
                {doc.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/^./, (s) => s.toUpperCase())}
              </button>
            );
          })}
        </div>
        <p className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          Changes apply to new document reviews, not already-verified applications.
        </p>
      </div>

      {/* 5. Status & Visibility */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="text-sm font-semibold text-foreground">Status &amp; Visibility</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Status</label>
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
          <div>
            <label className="text-[10px] font-medium text-muted-foreground block mb-1">Visibility</label>
            <select
              value={data.visibility}
              onChange={(e) => updateField("visibility", e.target.value)}
              className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {VISIBILITIES.map((v) => (
                <option key={v} value={v}>{v}</option>
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
              checked={data.accessCodeRequired}
              onChange={(e) => updateField("accessCodeRequired", e.target.checked)}
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
              checked={data.autoApprove}
              onChange={(e) => updateField("autoApprove", e.target.checked)}
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
