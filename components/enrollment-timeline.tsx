"use client";

import React from "react";
import {
  FileText,
  Search,
  CheckCircle,
  CalendarCheck,
  ArrowRightCircle,
  GraduationCap,
  XCircle,
  Clock,
} from "lucide-react";

interface TimelineStep {
  label: string;
  date: string | null;
  status: "completed" | "current" | "upcoming" | "skipped";
}

interface EnrollmentTimelineProps {
  applicationStatus: string;
  appliedDate: string;
  seatReservedAt: string | null;
  waitlistedAt: string | null;
  convertedAt: string | null;
  rejectionReason: string | null;
  rejectedAt: string | null;
}

const STATUS_ICONS = {
  completed: CheckCircle,
  current: Clock,
  upcoming: ArrowRightCircle,
  skipped: XCircle,
};

const STATUS_COLORS = {
  completed: "bg-emerald-500",
  current: "bg-blue-500",
  upcoming: "bg-gray-300",
  skipped: "bg-red-300",
};

function buildSteps(
  applicationStatus: string,
  appliedDate: string,
  seatReservedAt: string | null,
  waitlistedAt: string | null,
  convertedAt: string | null,
  rejectionReason: string | null,
  rejectedAt: string | null,
): TimelineStep[] {
  const isRejected = applicationStatus === "rejected";
  const isWaitlisted = applicationStatus === "waitlisted";

  const steps: TimelineStep[] = [
    {
      label: "Applied",
      date: appliedDate,
      status: "completed",
    },
    {
      label: "Under Review",
      date:
        applicationStatus === "under_review" || applicationStatus === "documents_verified" || applicationStatus === "seat_reserved" || convertedAt
          ? appliedDate
          : null,
      status:
        applicationStatus === "pending"
          ? "current"
          : applicationStatus === "under_review"
            ? "current"
            : ["documents_verified", "seat_reserved"].includes(applicationStatus) || convertedAt
              ? "completed"
              : "upcoming",
    },
    {
      label: "Documents Verified",
      date:
        applicationStatus === "documents_verified" || applicationStatus === "seat_reserved" || convertedAt
          ? appliedDate
          : null,
      status:
        applicationStatus === "documents_verified"
          ? "current"
          : applicationStatus === "seat_reserved" || convertedAt
            ? "completed"
            : "upcoming",
    },
    {
      label: "Seat Reserved",
      date: seatReservedAt,
      status:
        applicationStatus === "seat_reserved" && !convertedAt
          ? "current"
          : convertedAt
            ? "completed"
            : "upcoming",
    },
    {
      label: "Converted",
      date: convertedAt,
      status: convertedAt ? "completed" : "upcoming",
    },
  ];

  if (isRejected) {
    return [
      steps[0],
      {
        label: "Rejected",
        date: rejectedAt,
        status: "skipped",
      },
    ];
  }

  if (isWaitlisted) {
    return [
      steps[0],
      {
        label: "Waitlisted",
        date: waitlistedAt,
        status: "current",
      },
    ];
  }

  return steps;
}

export default function EnrollmentTimeline({
  applicationStatus,
  appliedDate,
  seatReservedAt,
  waitlistedAt,
  convertedAt,
  rejectionReason,
  rejectedAt,
}: EnrollmentTimelineProps) {
  const steps = buildSteps(applicationStatus, appliedDate, seatReservedAt, waitlistedAt, convertedAt, rejectionReason, rejectedAt);
  const completedSteps = steps.filter((s) => s.status === "completed").length;
  const totalSteps = steps.filter((s) => s.status !== "skipped").length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  const isHappyPath = applicationStatus !== "rejected" && applicationStatus !== "waitlisted";

  return (
    <div className="space-y-3">
      {isHappyPath && (
        <div className="relative h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="absolute left-0 top-0 h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const Icon = STATUS_ICONS[step.status];
          const dotColor = STATUS_COLORS[step.status];

          return (
            <div key={step.label} className="flex flex-col items-center relative flex-1">
              <div className={`w-3 h-3 rounded-full ${dotColor} ring-2 ring-white z-10`} />
              {idx < steps.length - 1 && (
                <div className="absolute top-1.5 left-[calc(50%+6px)] right-[calc(-50%+6px)] h-[2px] bg-gray-200" />
              )}
              <p className={`text-[9px] font-semibold mt-1 text-center ${step.status === "skipped" ? "text-red-500" : step.status === "current" ? "text-blue-600" : "text-muted-foreground"}`}>
                {step.label}
              </p>
              {step.date && (
                <p className="text-[8px] text-muted-foreground">{step.date}</p>
              )}
            </div>
          );
        })}
      </div>

      {rejectionReason && (
        <p className="text-[10px] text-red-600 italic mt-1">Reason: {rejectionReason}</p>
      )}
    </div>
  );
}
