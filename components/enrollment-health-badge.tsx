"use client";

import React from "react";
import { Shield, ShieldAlert, ShieldCheck } from "lucide-react";

interface HealthBadgeProps {
  overall: "healthy" | "warning" | "critical";
  score: number;
  size?: "sm" | "md";
}

const CONFIG = {
  healthy: {
    icon: ShieldCheck,
    bg: "bg-emerald-50 border-emerald-200",
    text: "text-emerald-700",
    label: "Healthy",
  },
  warning: {
    icon: Shield,
    bg: "bg-amber-50 border-amber-200",
    text: "text-amber-700",
    label: "Warning",
  },
  critical: {
    icon: ShieldAlert,
    bg: "bg-red-50 border-red-200",
    text: "text-red-700",
    label: "Critical",
  },
} as const;

export default function HealthBadge({ overall, score, size = "sm" }: HealthBadgeProps) {
  const config = CONFIG[overall];
  const Icon = config.icon;
  const isSmall = size === "sm";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${config.bg} ${config.text} ${isSmall ? "text-[9px]" : "text-[10px]"}`}
    >
      <Icon className={isSmall ? "w-2.5 h-2.5" : "w-3 h-3"} />
      {config.label} {score}
    </span>
  );
}
