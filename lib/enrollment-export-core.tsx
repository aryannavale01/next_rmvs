import React from "react";
import { pdf, Document as RPDFDocument, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// ---- Types ----

export interface PersonProfile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  gender: string | null;
  dob: string | null;
  district: string | null;
  state: string | null;
  qualification: string | null;
  aadhaarNumber: string | null;
  avatarUrl: string | null;
}

export interface PersonApplication {
  id: string;
  status: string;
  appliedDate: string;
  seatReservedAt: string | null;
  waitlistedAt: string | null;
  convertedAt: string | null;
}

export interface PersonEnrollment {
  id: string;
  status: string;
  batchLabel: string | null;
  seatNumber: number | null;
  enrollmentDate: string | null;
  attendance: number;
  completionDate: string | null;
}

export interface PersonDocument {
  id: string;
  type: string;
  label: string;
  status: string;
  fileUrl: string | null;
}

export interface PersonData {
  profile: PersonProfile;
  application: PersonApplication;
  enrollments: PersonEnrollment[];
  documents: PersonDocument[];
}

export interface CourseData {
  id: string;
  title: string;
  category: string;
  level: string;
  duration: string;
  description: string | null;
  seatsTotal: number | null;
  startDate: string | null;
  endDate: string | null;
}

// ---- Helpers ----

const NOT_PROVIDED = "—";

function fv(value: string | null | undefined): string {
  if (value == null || value === "") return NOT_PROVIDED;
  return value;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return NOT_PROVIDED;
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

// ---- PDF Styles ----

const pageWidth = 841.89;
const pageHeight = 595.28;
const pageMargin = 40;

const pdfStyles = StyleSheet.create({
  page: { padding: pageMargin, fontSize: 9, fontFamily: "Helvetica", width: pageWidth, height: pageHeight },

  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4, color: "#0f172a" },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  sectionLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#475569", marginBottom: 2 },
  description: { fontSize: 8, color: "#475569", marginBottom: 8, lineHeight: 1.4 },
  metaRow: { flexDirection: "row", marginBottom: 2 },
  metaLabel: { width: 100, fontFamily: "Helvetica-Bold", fontSize: 8, color: "#64748b" },
  metaValue: { flex: 1, fontSize: 8, color: "#1e293b" },

  rosterHeader: { flexDirection: "row", backgroundColor: "#1e40af", paddingVertical: 5, paddingHorizontal: 4 },
  rosterHeaderText: { fontFamily: "Helvetica-Bold", fontSize: 7, color: "#ffffff" },
  rosterRow: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  rosterRowAlt: { flexDirection: "row", paddingVertical: 3, paddingHorizontal: 4, backgroundColor: "#f8fafc", borderBottomWidth: 0.5, borderBottomColor: "#e2e8f0" },
  rosterCell: { fontSize: 7, color: "#1e293b" },

  profileName: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 2, color: "#0f172a" },
  profileId: { fontSize: 8, color: "#94a3b8", marginBottom: 12 },
  sectionHeading: { fontSize: 10, fontFamily: "Helvetica-Bold", color: "#1e40af", marginTop: 10, marginBottom: 5, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: "#bfdbfe" },
  fieldRow: { flexDirection: "row", marginBottom: 2 },
  fieldLabel: { width: 110, fontFamily: "Helvetica-Bold", color: "#475569", fontSize: 8 },
  fieldValue: { flex: 1, color: "#1e293b", fontSize: 8 },
  docImage: { width: 160, height: 110, marginTop: 4, marginBottom: 8, objectFit: "contain" as const },
  avatarImage: { width: 48, height: 48, borderRadius: 24, marginRight: 10 },

  footer: { position: "absolute", bottom: 20, left: pageMargin, right: pageMargin, fontSize: 7, color: "#94a3b8", textAlign: "center", borderTopWidth: 0.5, borderTopColor: "#e2e8f0", paddingTop: 6 },
});

const ROSTER_COL_WIDTHS = [110, 120, 70, 70, 60, 60, 55];
const ROSTER_HEADERS = ["Name", "Email", "Phone", "Status", "Applied", "Enrolled", "Batch/Seat"];
const ROWS_PER_PAGE = 35;

// ---- Section 1: Course Details ----

const CourseDetailsSection = ({ course, recordCount }: { course: CourseData | null; recordCount: number }) =>
  React.createElement(
    Page,
    { size: [pageWidth, pageHeight], style: pdfStyles.page },
    React.createElement(Text, { style: pdfStyles.title }, course?.title ?? "Course Export"),
    course
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(
            Text,
            { style: pdfStyles.subtitle },
            `${course.category} · ${course.level} · ${course.duration}`,
          ),
          React.createElement(
            View,
            { style: { marginTop: 12 } },
            React.createElement(
              View,
              { style: pdfStyles.metaRow },
              React.createElement(Text, { style: pdfStyles.metaLabel }, "Category"),
              React.createElement(Text, { style: pdfStyles.metaValue }, course.category),
            ),
            React.createElement(
              View,
              { style: pdfStyles.metaRow },
              React.createElement(Text, { style: pdfStyles.metaLabel }, "Level"),
              React.createElement(Text, { style: pdfStyles.metaValue }, course.level),
            ),
            React.createElement(
              View,
              { style: pdfStyles.metaRow },
              React.createElement(Text, { style: pdfStyles.metaLabel }, "Duration"),
              React.createElement(Text, { style: pdfStyles.metaValue }, course.duration),
            ),
            React.createElement(
              View,
              { style: pdfStyles.metaRow },
              React.createElement(Text, { style: pdfStyles.metaLabel }, "Total Seats"),
              React.createElement(Text, { style: pdfStyles.metaValue }, course.seatsTotal != null ? String(course.seatsTotal) : NOT_PROVIDED),
            ),
            React.createElement(
              View,
              { style: pdfStyles.metaRow },
              React.createElement(Text, { style: pdfStyles.metaLabel }, "Start Date"),
              React.createElement(Text, { style: pdfStyles.metaValue }, formatDate(course.startDate)),
            ),
            React.createElement(
              View,
              { style: pdfStyles.metaRow },
              React.createElement(Text, { style: pdfStyles.metaLabel }, "End Date"),
              React.createElement(Text, { style: pdfStyles.metaValue }, formatDate(course.endDate)),
            ),
            course.description
              ? React.createElement(
                  View,
                  { style: { marginTop: 8 } },
                  React.createElement(Text, { style: pdfStyles.sectionLabel }, "Description"),
                  React.createElement(Text, { style: pdfStyles.description }, course.description),
                )
              : null,
          ),
        )
      : null,
    React.createElement(
      Text,
      { style: pdfStyles.footer, fixed: true },
      `Generated — ${new Date().toLocaleDateString("en-IN")} | ${recordCount} records`,
    ),
  );

// ---- Section 2: Roster Table ----

const RosterHeader = () =>
  React.createElement(
    View,
    { style: pdfStyles.rosterHeader, fixed: true },
    ROSTER_HEADERS.map((h, i) =>
      React.createElement(Text, { key: i, style: [pdfStyles.rosterHeaderText, { width: ROSTER_COL_WIDTHS[i] }] }, h),
    ),
  );

const RosterRow = ({ person, index }: { person: PersonData; index: number }) => {
  const rowStyle = index % 2 === 0 ? pdfStyles.rosterRow : pdfStyles.rosterRowAlt;
  const enroll = person.enrollments[0];
  const status = enroll?.status ?? person.application.status;
  const batchSeat = enroll?.batchLabel
    ? `${enroll.batchLabel}${enroll.seatNumber != null ? ` #${enroll.seatNumber}` : ""}`
    : NOT_PROVIDED;
  const values = [
    person.profile.fullName,
    person.profile.email,
    fv(person.profile.phone),
    status.replace(/_/g, " "),
    formatDate(person.application.appliedDate),
    enroll ? formatDate(enroll.enrollmentDate) : NOT_PROVIDED,
    batchSeat,
  ];
  return React.createElement(
    View,
    { style: rowStyle, wrap: false },
    values.map((v, i) =>
      React.createElement(Text, { key: i, style: [pdfStyles.rosterCell, { width: ROSTER_COL_WIDTHS[i] }] }, v),
    ),
  );
};

function RosterTableSection(people: PersonData[]): React.ReactElement[] {
  const pages: PersonData[][] = [];
  for (let i = 0; i < people.length; i += ROWS_PER_PAGE) {
    pages.push(people.slice(i, i + ROWS_PER_PAGE));
  }
  return pages.map((pagePeople, pi) =>
    React.createElement(
      Page,
      { key: `roster-${pi}`, size: [pageWidth, pageHeight], style: pdfStyles.page },
      pi === 0
        ? React.createElement(Text, { style: pdfStyles.subtitle }, `Roster — ${people.length} record${people.length !== 1 ? "s" : ""}`)
        : React.createElement(Text, { style: pdfStyles.subtitle }, "Roster (continued)"),
      React.createElement(RosterHeader),
      pagePeople.map((p, i) =>
        React.createElement(RosterRow, { key: p.profile.id, person: p, index: pi * ROWS_PER_PAGE + i }),
      ),
      React.createElement(Text, { style: pdfStyles.footer, fixed: true }, `Confidential — Roster Page ${pi + 1}`),
    ),
  );
}

// ---- Section 3: Individual Profile Pages ----

const ProfilePage = ({
  person,
  docDataUris,
  avatarUri,
}: {
  person: PersonData;
  docDataUris: Record<string, string | null>;
  avatarUri: string | null;
}) =>
  React.createElement(
    Page,
    { size: [pageWidth, pageHeight], style: pdfStyles.page },
    // Header with avatar
    React.createElement(
      View,
      { style: { flexDirection: "row", alignItems: "center", marginBottom: 12 } },
      avatarUri ? React.createElement(Image, { style: pdfStyles.avatarImage, src: avatarUri }) : null,
      React.createElement(
        View,
        null,
        React.createElement(Text, { style: pdfStyles.profileName }, person.profile.fullName),
        React.createElement(Text, { style: pdfStyles.profileId }, `Application ID: ${person.application.id}`),
      ),
    ),

    // Personal Information
    React.createElement(Text, { style: pdfStyles.sectionHeading }, "Personal Information"),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Email"), React.createElement(Text, { style: pdfStyles.fieldValue }, person.profile.email)),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Phone"), React.createElement(Text, { style: pdfStyles.fieldValue }, fv(person.profile.phone))),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Gender"), React.createElement(Text, { style: pdfStyles.fieldValue }, fv(person.profile.gender))),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Date of Birth"), React.createElement(Text, { style: pdfStyles.fieldValue }, fv(person.profile.dob))),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "District"), React.createElement(Text, { style: pdfStyles.fieldValue }, fv(person.profile.district))),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "State"), React.createElement(Text, { style: pdfStyles.fieldValue }, fv(person.profile.state))),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Qualification"), React.createElement(Text, { style: pdfStyles.fieldValue }, fv(person.profile.qualification))),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Aadhaar"), React.createElement(Text, { style: pdfStyles.fieldValue }, person.profile.aadhaarNumber ? `XXXX-XXXX-${person.profile.aadhaarNumber.slice(-4)}` : NOT_PROVIDED)),

    // Application
    React.createElement(Text, { style: pdfStyles.sectionHeading }, "Application"),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Status"), React.createElement(Text, { style: pdfStyles.fieldValue }, person.application.status.replace(/_/g, " "))),
    React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Applied"), React.createElement(Text, { style: pdfStyles.fieldValue }, formatDate(person.application.appliedDate))),
    person.application.seatReservedAt ? React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Seat Reserved"), React.createElement(Text, { style: pdfStyles.fieldValue }, formatDate(person.application.seatReservedAt))) : null,
    person.application.waitlistedAt ? React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Waitlisted"), React.createElement(Text, { style: pdfStyles.fieldValue }, formatDate(person.application.waitlistedAt))) : null,

    // Enrollment
    person.enrollments.length > 0
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(Text, { style: pdfStyles.sectionHeading }, "Enrollment"),
          ...person.enrollments.map((e) =>
            React.createElement(
              View,
              { key: e.id },
              React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Status"), React.createElement(Text, { style: pdfStyles.fieldValue }, e.status.replace(/_/g, " "))),
              React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Enrolled"), React.createElement(Text, { style: pdfStyles.fieldValue }, formatDate(e.enrollmentDate))),
              e.batchLabel ? React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Batch"), React.createElement(Text, { style: pdfStyles.fieldValue }, e.batchLabel)) : null,
              e.seatNumber != null ? React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, "Seat"), React.createElement(Text, { style: pdfStyles.fieldValue }, `#${e.seatNumber}`)) : null,
            ),
          ),
        )
      : null,

    // Documents
    person.documents.length > 0
      ? React.createElement(
          React.Fragment,
          null,
          React.createElement(Text, { style: pdfStyles.sectionHeading }, "Documents"),
          ...person.documents.map((doc) =>
            React.createElement(
              View,
              { key: doc.id, wrap: false },
              React.createElement(View, { style: pdfStyles.fieldRow }, React.createElement(Text, { style: pdfStyles.fieldLabel }, doc.label), React.createElement(Text, { style: pdfStyles.fieldValue }, doc.status.replace(/_/g, " "))),
              docDataUris[doc.id] ? React.createElement(Image, { style: pdfStyles.docImage, src: docDataUris[doc.id]! }) : null,
            ),
          ),
        )
      : null,

    React.createElement(Text, { style: pdfStyles.footer, fixed: true }, `Confidential — ${person.profile.fullName}`),
  );

// ---- Document Builder ----

function buildDoc(
  people: PersonData[],
  course: CourseData | null,
  docDataUris: Record<string, string | null>,
  avatarUris: Record<string, string | null>,
): React.ReactElement {
  const children: React.ReactElement[] = [];

  children.push(CourseDetailsSection({ course, recordCount: people.length }));

  const rosterPages = RosterTableSection(people);
  children.push(...rosterPages);

  for (const person of people) {
    children.push(
      ProfilePage({
        person,
        docDataUris,
        avatarUri: avatarUris[person.profile.id] ?? null,
      }),
    );
  }

  return React.createElement(RPDFDocument, null, ...children);
}

// ---- Server-side PDF generation ----

export async function buildPdfBlob(
  people: PersonData[],
  course: CourseData | null,
  docDataUris: Record<string, string | null>,
  avatarDataUris: Record<string, string | null>,
): Promise<Blob> {
  const doc = buildDoc(people, course, docDataUris, avatarDataUris) as unknown as React.ReactElement<React.ComponentProps<typeof RPDFDocument>>;
  return pdf(doc).toBlob();
}
