"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Award,
  BookOpen,
  FileCheck,
  CheckCircle2,
  Clock,
  Search,
  Loader2,
  ChevronRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";

interface CourseCertCard {
  id: string;
  title: string;
  category: string;
  level: string;
  certs: {
    enrolled: number;
    completed: number;
    eligible: number;
    generated: number;
    approved: number;
    pending: number;
    revoked: number;
  };
}

interface OverviewData {
  totalCourses: number;
  totalEnrolled: number;
  totalCompleted: number;
  totalEligible: number;
  totalGenerated: number;
  totalApproved: number;
  totalPending: number;
  pendingRequests: number;
}

export default function CertificatesPage() {
  const [courses, setCourses] = useState<CourseCertCard[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadData = useCallback((signal?: AbortSignal) => {
    fetch("/api/admin/certificates", { signal })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load (${r.status})`);
        return r.json();
      })
      .then((res) => {
        setCourses(res.data?.courses ?? []);
        setOverview(res.data?.overview ?? null);
      })
      .catch((err) => { setError(err.message || 'Failed to load certificate data'); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
  }, [loadData]);

  const retry = () => {
    setLoading(true);
    setError(null);
    loadData();
  };

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Metrics */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
          <MetricCard icon={BookOpen} label="Trainings" value={overview.totalCourses} />
          <MetricCard icon={Sparkles} label="Eligible" value={overview.totalEligible} />
          <MetricCard icon={Award} label="Generated" value={overview.totalGenerated} />
          <MetricCard icon={CheckCircle2} label="Approved" value={overview.totalApproved} />
          <MetricCard icon={Clock} label="Pending Review" value={overview.totalPending} />
          <MetricCard icon={FileCheck} label="Open Requests" value={overview.pendingRequests} />
        </div>
      )}

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search trainings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          <span className="ml-2 text-xs text-muted-foreground">Loading certificates...</span>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card border border-border rounded-xl">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">{error}</p>
          <button onClick={retry} className="mt-3 px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-lg">Retry</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Award className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No trainings found</p>
          <p className="text-[10px] text-muted-foreground">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => {
            const total = course.certs.generated + course.certs.eligible;
            const pct =
              total > 0 ? Math.min(100, Math.round((course.certs.generated / total) * 100)) : 0;
            const complete = course.certs.eligible === 0 && course.certs.generated > 0;
            return (
              <Link
                key={course.id}
                href={`/admin/certificates/${course.id}`}
                className="block bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-[10px] text-muted-foreground capitalize">{course.category}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      complete
                        ? "bg-success-bg text-success-text border border-success/20"
                        : course.certs.pending > 0
                          ? "bg-warning-bg text-warning-text border border-warning/20"
                          : "bg-primary-light text-primary border border-primary/20"
                    }`}
                  >
                    {course.certs.pending > 0
                      ? `${course.certs.pending} pending`
                      : complete
                        ? "Complete"
                        : "In progress"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-2">
                  <div className="relative h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: complete ? "#10b981" : "#8b5cf6",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      {course.certs.generated} generated · {course.certs.approved} approved
                    </span>
                    <span className={`font-semibold ${complete ? "text-emerald-600" : "text-violet-600"}`}>
                      {course.certs.eligible} eligible
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-3 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                  Open workspace
                  <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
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
