"use client";

import React from "react";
import { X, CheckCircle, AlertTriangle, ArrowRightCircle, XCircle } from "lucide-react";

interface BulkPreviewItem {
  applicationId: string;
  memberName: string;
  courseTitle: string;
  currentStatus: string;
  targetStatus: string;
  canProceed: boolean;
  reason: string;
}

interface EnrollmentBulkPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  action: "approve" | "waitlist" | "reject" | "convert" | "promote" | "move_to_review" | "remove" | "bulk_drop" | "bulk_complete";
  items: BulkPreviewItem[];
  onConfirm: () => void;
  isProcessing: boolean;
}

const ACTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  approve: { label: "Approve", color: "text-emerald-700", bg: "bg-emerald-50" },
  waitlist: { label: "Waitlist", color: "text-amber-700", bg: "bg-amber-50" },
  reject: { label: "Reject", color: "text-red-700", bg: "bg-red-50" },
  convert: { label: "Convert to Enrollment", color: "text-blue-700", bg: "bg-blue-50" },
  promote: { label: "Promote", color: "text-emerald-700", bg: "bg-emerald-50" },
  move_to_review: { label: "Move to Review", color: "text-blue-700", bg: "bg-blue-50" },
  remove: { label: "Remove", color: "text-gray-700", bg: "bg-gray-100" },
  bulk_drop: { label: "Drop", color: "text-red-700", bg: "bg-red-50" },
  bulk_complete: { label: "Mark Completed", color: "text-emerald-700", bg: "bg-emerald-50" },
};

export default function EnrollmentBulkPreview({
  isOpen,
  onClose,
  action,
  items,
  onConfirm,
  isProcessing,
}: EnrollmentBulkPreviewProps) {
  if (!isOpen) return null;

  const proceedable = items.filter((i) => i.canProceed);
  const skipped = items.filter((i) => !i.canProceed);
  const config = ACTION_LABELS[action];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-foreground">
            Preview: {config.label} {items.length} Applications
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {proceedable.map((item) => (
            <div key={item.applicationId} className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-200/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{item.memberName}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.courseTitle}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  {item.currentStatus}
                </span>
                <ArrowRightCircle className="w-3 h-3 text-muted-foreground inline mx-1" />
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                  {item.targetStatus}
                </span>
              </div>
            </div>
          ))}

          {skipped.map((item) => (
            <div key={item.applicationId} className="flex items-center gap-3 p-3 bg-muted/30 border border-border/50 rounded-lg opacity-60">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{item.memberName}</p>
                <p className="text-[10px] text-muted-foreground">{item.reason}</p>
              </div>
              <span className="text-[9px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
                Skipped
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-border">
          <p className="text-[10px] text-muted-foreground">
            {proceedable.length} to process, {skipped.length} will be skipped
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={proceedable.length === 0 || isProcessing}
              className="px-4 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? "Processing..." : `Confirm ${config.label}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
