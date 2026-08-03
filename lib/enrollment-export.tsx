"use client";

import React from "react";
import { pdf, Document as RPDFDocument, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type {
  PersonData,
  CourseData,
  PersonDocument,
} from "./enrollment-export-core";
import {
  buildPdfBlob,
} from "./enrollment-export-core";

// ---- Types (re-exported for backwards compat) ----

export interface EnrollmentExportRow {
  applicationId: string;
  memberName: string;
  email: string;
  phone: string;
  district: string;
  state: string;
  qualification: string;
  courseTitle: string;
  courseCategory: string;
  courseDuration: string;
  status: string;
  appliedDate: string;
  seatReservedAt: string;
  waitlistedAt: string;
  convertedAt: string;
  reviewNotes: string;
  rejectionReason: string;
  paymentStatus: string;
  amountPaid: string;
}

export interface ExportMetadata {
  generatedBy: string;
  role: string;
  generatedAt: string;
  version: string;
  totalRecords: number;
  filters: Record<string, string>;
}

// ---- Helpers ----

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

// Pre-fetch a document image as base64 data URI via the admin proxy route
async function fetchImageAsDataUri(docId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/admin/documents/${docId}/image`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Pre-fetch avatar as base64 data URI via admin proxy route
async function fetchAvatarAsDataUri(profileId: string | null): Promise<string | null> {
  if (!profileId) return null;
  try {
    const res = await fetch(`/api/admin/profile-photo/${profileId}`);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// Pre-fetch all images for a set of people
async function preFetchAllImages(
  people: PersonData[],
): Promise<{ docUris: Record<string, string | null>; avatarUris: Record<string, string | null> }> {
  const docFetches = people.flatMap((p) =>
    p.documents.filter((d) => d.fileUrl).map((d) => fetchImageAsDataUri(d.id).then((uri) => ({ id: d.id, uri }))),
  );
  const avatarFetches = people
    .filter((p) => p.profile.avatarUrl)
    .map((p) => fetchAvatarAsDataUri(p.profile.id).then((uri) => ({ id: p.profile.id, uri })));

  const docResults = await Promise.all(docFetches);
  const avatarResults = await Promise.all(avatarFetches);

  const docUris: Record<string, string | null> = {};
  for (const r of docResults) docUris[r.id] = r.uri;

  const avatarUris: Record<string, string | null> = {};
  for (const r of avatarResults) avatarUris[r.id] = r.uri;

  return { docUris, avatarUris };
}

// ---- Exported Functions ----

export async function exportEnrollmentsPdf(
  people: PersonData[],
  course: CourseData | null,
  metadata: ExportMetadata,
) {
  // Pre-fetch all images first (async), then render PDF (sync)
  const { docUris, avatarUris } = await preFetchAllImages(people);
  const blob = await buildPdfBlob(people, course, docUris, avatarUris);
  downloadBlob(blob, `enrollment-export-${new Date().toISOString().split("T")[0]}.pdf`);
}

// ---- DOCX Export ----

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  ShadingType,
} from "docx";

function docxHeaderRow() {
  return new TableRow({
    tableHeader: true,
    children: [
      "Member",
      "Email",
      "Phone",
      "Course",
      "Status",
      "Applied",
      "District",
      "Payment",
    ].map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, bold: true, size: 16, color: "475569" })],
            }),
          ],
          shading: { type: ShadingType.SOLID, color: "F1F5F9" },
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
    ),
  });
}

function docxDataRow(row: EnrollmentExportRow) {
  const values = [
    row.memberName,
    row.email,
    row.phone ?? "—",
    row.courseTitle.length > 30 ? row.courseTitle.slice(0, 27) + "..." : row.courseTitle,
    row.status.replace(/_/g, " "),
    row.appliedDate,
    row.district ?? "—",
    row.paymentStatus,
  ];
  return new TableRow({
    children: values.map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [new TextRun({ text, size: 18 })],
            }),
          ],
          width: { size: 12, type: WidthType.PERCENTAGE },
        }),
    ),
  });
}

export async function exportEnrollmentsDocx(
  data: EnrollmentExportRow[],
  metadata: ExportMetadata,
) {
  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [docxHeaderRow(), ...data.map(docxDataRow)],
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          new Paragraph({
            children: [new TextRun({ text: "Enrollment Export", bold: true, size: 32 })],
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Generated by ${metadata.generatedBy} (${metadata.role}) on ${new Date(metadata.generatedAt).toLocaleDateString()}`,
                size: 18,
                color: "666666",
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Records: ${metadata.totalRecords} | ERP Version: ${metadata.version}`,
                size: 18,
                color: "666666",
              }),
            ],
            spacing: { after: 200 },
          }),
          table,
          new Paragraph({
            children: [
              new TextRun({
                text: `Filters: Course=${metadata.filters.courseId ?? "All"}, Status=${metadata.filters.status ?? "All"}`,
                size: 16,
                color: "94a3b8",
                italics: true,
              }),
            ],
            spacing: { before: 200 },
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `enrollment-export-${new Date().toISOString().split("T")[0]}.docx`);
}
