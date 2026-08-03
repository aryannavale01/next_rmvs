"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Users,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  Search,
  Loader2,
} from "lucide-react";
import HealthBadge from "@/components/enrollment-health-badge";

interface CourseCard {
  id: string;
  title: string;
  category: string;
  seats: {
    capacity: number;
    reserved: number;
    enrolled: number;
    available: number;
  } | null;
  health: {
    overall: "healthy" | "warning" | "critical";
    score: number;
  };
}

interface OverviewData {
  totalCourses: number;
  totalApplications: number;
  totalEnrolled: number;
  totalMembers: number;
  globalStatusBreakdown: { status: string; count: number }[];
}

export default function TrainingCardsPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/enrollments/analytics")
      .then((r) => r.json())
      .then((res) => {
        setCourses(res.data.courses ?? []);
        setOverview(res.data.overview ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = courses.filter(
    (c) =>
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4 font-sans">
      {/* Metrics */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard icon={BookOpen} label="Active Courses" value={overview.totalCourses} />
          <MetricCard icon={Users} label="Total Applications" value={overview.totalApplications} />
          <MetricCard icon={BarChart3} label="Currently Enrolled" value={overview.totalEnrolled} />
          <MetricCard icon={Users} label="Total Members" value={overview.totalMembers} />
        </div>
      )}

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Training Cards Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          <span className="ml-2 text-xs text-muted-foreground">Loading courses...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-sm font-semibold text-foreground">No courses found</p>
          <p className="text-[10px] text-muted-foreground">Try adjusting your search</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((course) => (
            <button
              key={course.id}
              onClick={() => router.push(`/admin/enrollments/${course.id}`)}
              className="bg-card border border-border rounded-xl p-4 text-left hover:border-primary/30 hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-[10px] text-muted-foreground capitalize">{course.category}</p>
                </div>
                <HealthBadge overall={course.health.overall} score={course.health.score} size="sm" />
              </div>

              {course.seats && (
                <div className="space-y-2">
                  {/* Seat bar */}
                  <div className="relative h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-all"
                      style={{
                        width: `${course.seats.capacity > 0 ? ((course.seats.reserved + course.seats.enrolled) / course.seats.capacity) * 100 : 0}%`,
                        backgroundColor:
                          course.seats.available === 0
                            ? "#ef4444"
                            : course.seats.available <= course.seats.capacity * 0.2
                              ? "#f59e0b"
                              : "#10b981",
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-muted-foreground">
                      {course.seats.enrolled + course.seats.reserved} / {course.seats.capacity} filled
                    </span>
                    <span
                      className={`font-semibold ${
                        course.seats.available === 0
                          ? "text-red-600"
                          : course.seats.available <= course.seats.capacity * 0.2
                            ? "text-amber-600"
                            : "text-emerald-600"
                      }`}
                    >
                      {course.seats.available} available
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end mt-3 text-[10px] text-muted-foreground group-hover:text-primary transition-colors">
                Open workspace
                <ChevronRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
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
