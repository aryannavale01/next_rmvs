"use client";

import React, { useState } from "react";
import { FileText, FileSpreadsheet, X } from "lucide-react";

interface EnrollmentExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  courseId?: string;
  status?: string;
  selectedCount?: number;
  totalCount?: number;
  onExport: (format: "csv" | "pdf" | "docx", scope: "all" | "selected", courseId?: string, status?: string) => void;
}

const FORMATS = [
  { key: "csv" as const, label: "CSV", icon: FileSpreadsheet },
  { key: "pdf" as const, label: "PDF", icon: FileText },
  { key: "docx" as const, label: "DOCX", icon: FileText },
];

export default function EnrollmentExportModal({
  isOpen,
  onClose,
  courseId,
  status,
  selectedCount = 0,
  totalCount = 0,
  onExport,
}: EnrollmentExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"csv" | "pdf" | "docx">("csv");
  const [scope, setScope] = useState<"all" | "selected">("all");

  if (!isOpen) return null;

  const handleExport = () => {
    onExport(selectedFormat, scope, courseId, status);
  };

  const showWarning = scope === "all" && totalCount > 50;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-sm p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-foreground">Export Enrollment Data</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scope Selector */}
        <div className="mb-4">
          <p className="text-[10px] font-medium text-muted-foreground mb-2">Scope</p>
          <div className="flex gap-2">
            <button
              onClick={() => setScope("all")}
              className={`flex-1 px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                scope === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              All ({totalCount})
            </button>
            <button
              onClick={() => setScope("selected")}
              disabled={selectedCount === 0}
              className={`flex-1 px-3 py-2 text-[11px] font-medium rounded-lg border transition-colors ${
                scope === "selected"
                  ? "bg-primary text-primary-foreground border-primary"
                  : selectedCount === 0
                    ? "bg-muted/50 text-muted-foreground/40 border-border cursor-not-allowed"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/30"
              }`}
            >
              Selected ({selectedCount})
            </button>
          </div>
          {selectedCount === 0 && (
            <p className="text-[9px] text-muted-foreground mt-1">Select rows in the Applications tab first</p>
          )}
        </div>

        {/* Warning for large exports */}
        {showWarning && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[10px] text-amber-700">
              This course has {totalCount} records. PDF generation for all records may take a minute.
            </p>
          </div>
        )}

        {/* Format Selection */}
        <p className="text-[10px] font-medium text-muted-foreground mb-2">Format</p>
        <div className="flex gap-2 mb-5">
          {FORMATS.map((fmt) => {
            const Icon = fmt.icon;
            const isActive = selectedFormat === fmt.key;
            return (
              <button
                key={fmt.key}
                onClick={() => setSelectedFormat(fmt.key)}
                className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-lg border text-[10px] font-medium transition-colors ${
                  isActive
                    ? "bg-primary/5 text-primary border-primary"
                    : "bg-muted text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                <Icon className="w-5 h-5" />
                {fmt.label}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-[11px] font-medium bg-muted text-muted-foreground rounded-lg hover:bg-muted/80 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            className="flex-1 px-4 py-2 text-[11px] font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary-hover transition-colors"
          >
            Export
          </button>
        </div>
      </div>
    </div>
  );
}
