import React from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, VerticalAlign, PageOrientation, Header, Footer, PageNumber } from 'docx';
import { pdf, Document as RPDFDocument, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// ============================================================================
// TYPES
// ============================================================================

export type ExportableMember = Record<string, unknown> & {
  documents?: { type: string; label: string; status: string; verifiedBy?: string | null; rejectionReason?: string | null }[];
  enrollments?: { courseTitle: string; status: string; completionDate: string | null }[];
};

// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

const FIELD_LABELS: Record<string, string> = {
  fullName: 'Full Name',
  email: 'Email',
  phone: 'Phone',
  age: 'Age',
  gender: 'Gender',
  dob: 'Date of Birth',
  status: 'Status',
  aadhaarNumber: 'Aadhaar',
  panNumber: 'PAN',
  addressLine1: 'Address Line',
  village: 'Village',
  taluka: 'Taluka',
  district: 'District',
  state: 'State',
  pincode: 'Pincode',
  qualification: 'Education',
  assignedVolunteer: 'Coordinator',
  createdAt: 'Registered',
  category: 'Social Category',
  occupation: 'Occupation',
  educationQualification: 'Education Qualification',
  maritalStatus: 'Marital Status',
  bloodGroup: 'Blood Group',
};

const ORG_NAME = 'CompassionGlobal';
const ORG_SUB = 'Rupasri Mahila Vikas Sanstha';
const DOC_TITLE = 'Beneficiary Dossier Export';

function dateStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

function generatedAt(): string {
  return new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type ToneKey = 'green' | 'amber' | 'red' | 'slate' | 'blue';

function memberTone(status: string): ToneKey {
  const s = (status || '').toLowerCase();
  if (s === 'active' || s === 'verified') return 'green';
  if (s === 'inactive') return 'slate';
  if (s === 'suspended' || s === 'pending' || s === 'not_uploaded') return 'amber';
  if (s === 'blocked' || s === 'rejected' || s === 'deleted') return 'red';
  return 'slate';
}

// ============================================================================
// HELPERS
// ============================================================================

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function fieldLabel(key: string): string {
  return FIELD_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
}

const NOT_PROVIDED = 'Not provided';

function fv(member: ExportableMember, key: string): string {
  const v = member[key];
  if (v == null || v === '') return NOT_PROVIDED;
  return String(v);
}

function maskAadhaar(value: unknown): string {
  if (!value || typeof value !== 'string') return NOT_PROVIDED;
  const digits = value.replace(/-/g, '');
  if (digits.length < 4) return NOT_PROVIDED;
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function formatField(member: ExportableMember, key: string): string {
  if (key === 'aadhaarNumber') return maskAadhaar(member.aadhaarNumber);
  return fv(member, key);
}

function docStatusText(status: string): string {
  if (status === 'verified') return 'Verified';
  if (status === 'pending' || status === 'not_uploaded') return 'Pending';
  if (status === 'rejected') return 'Rejected';
  return status;
}

// ============================================================================
// SECTION GROUPS — shared across all formats
// ============================================================================

type SectionDef = { heading: string; fields: string[] };

const SECTIONS: SectionDef[] = [
  { heading: 'Personal Information', fields: ['fullName', 'email', 'phone', 'age', 'gender', 'dob', 'status', 'qualification'] },
  { heading: 'Identity', fields: ['aadhaarNumber', 'panNumber'] },
  { heading: 'Address', fields: ['addressLine1', 'village', 'taluka', 'district', 'state', 'pincode'] },
  { heading: 'Beneficiary Details', fields: ['category', 'occupation', 'educationQualification', 'maritalStatus', 'bloodGroup'] },
  { heading: 'Administrative', fields: ['assignedVolunteer', 'createdAt'] },
];

// Table columns for summary
const TABLE_COLS = [
  { key: 'fullName', label: 'Name', width: 120 },
  { key: 'age', label: 'Age', width: 40 },
  { key: 'gender', label: 'Gender', width: 60 },
  { key: 'category', label: 'Category', width: 60 },
  { key: 'village', label: 'Village', width: 90 },
  { key: 'district', label: 'District', width: 70 },
  { key: 'status', label: 'Status', width: 60 },
  { key: 'docsVerified', label: 'Docs Verified', width: 70 },
];

function docsVerifiedText(m: ExportableMember): string {
  const docs = m.documents;
  if (!docs || !Array.isArray(docs) || docs.length === 0) return 'N/A';
  const verified = docs.filter(d => d.status === 'verified').length;
  return `${verified}/${docs.length}`;
}

function summaryValues(m: ExportableMember): string[] {
  return [
    fv(m, 'fullName'),
    fv(m, 'age'),
    fv(m, 'gender'),
    fv(m, 'category'),
    fv(m, 'village'),
    fv(m, 'district'),
    fv(m, 'status'),
    docsVerifiedText(m),
  ];
}

function selectedSections(fields: string[]): [string, string[]][] {
  const out: [string, string[]][] = [];
  for (const sec of SECTIONS) {
    const secFields = sec.fields.filter(f => fields.includes(f));
    if (secFields.length > 0) out.push([sec.heading, secFields]);
  }
  return out;
}

// ============================================================================
// CSV EXPORT (unchanged)
// ============================================================================

export function exportCSV(members: ExportableMember[], fields: string[]) {
  const header = fields.map(fieldLabel).join(',');

  const rows = members.map(m => {
    const cells = fields.map(f => escapeCSV(formatField(m, f)));

    const docs = m.documents as { type: string; status: string }[] | undefined;
    if (docs && Array.isArray(docs)) {
      const verified = docs.filter(d => d.status === 'verified').length;
      const total = docs.length;
      cells.push(escapeCSV(`${verified}/${total} verified`));
    } else {
      cells.push(escapeCSV(NOT_PROVIDED));
    }

    const enrs = m.enrollments as { courseTitle: string; status: string; completionDate: string | null }[] | undefined;
    if (enrs && enrs.length > 0) {
      const summary = enrs.map(e => `${e.courseTitle} (${e.status})`).join('; ');
      cells.push(escapeCSV(summary));
    } else {
      cells.push(escapeCSV('No enrollments'));
    }

    return cells;
  });

  const allHeaders = [...fields.map(fieldLabel), 'Documents', 'Enrollments'];
  const csv = [allHeaders.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `Beneficiary_Dossier_Export_${dateStamp()}.csv`);
}

// ============================================================================
// PDF EXPORT — landscape, branded summary table + dossier detail cards
// ============================================================================

const pageWidth = 841.89;
const pageHeight = 595.28;
const pageMargin = 40;

const C = {
  primaryDark: '#1E3A8A',
  primary: '#1E40AF',
  primarySoft: '#DBEAFE',
  ink: '#0F172A',
  body: '#334155',
  muted: '#64748B',
  faint: '#94A3B8',
  line: '#E2E8F0',
  zebra: '#F8FAFC',
  green: '#15803D',
  amber: '#B45309',
  red: '#B91C1C',
  slate: '#475569',
  greenBg: '#DCFCE7',
  amberBg: '#FEF3C7',
  redBg: '#FEE2E2',
  slateBg: '#F1F5F9',
};

function toneColor(tone: ToneKey): string {
  if (tone === 'green') return C.green;
  if (tone === 'amber') return C.amber;
  if (tone === 'red') return C.red;
  return C.slate;
}

function toneBg(tone: ToneKey): string {
  if (tone === 'green') return C.greenBg;
  if (tone === 'amber') return C.amberBg;
  if (tone === 'red') return C.redBg;
  return C.slateBg;
}

const pdfStyles = StyleSheet.create({
  /* Branded band */
  band: { marginBottom: 14, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: C.primary, borderBottomStyle: 'solid' },
  bandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  orgName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: C.primaryDark, letterSpacing: 2 },
  orgSub: { fontSize: 7.5, color: C.faint, letterSpacing: 1, marginTop: 1 },
  bandMeta: { fontSize: 7.5, color: C.muted, textAlign: 'right' },

  title: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: C.ink, marginTop: 12, marginBottom: 3 },
  subtitle: { fontSize: 9, color: C.muted, marginBottom: 12 },

  /* Summary table */
  tableHeader: { flexDirection: 'row', backgroundColor: C.primary, paddingVertical: 6, paddingHorizontal: 5 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ffffff' },
  tableRow: { flexDirection: 'row', paddingVertical: 4.5, paddingHorizontal: 5, borderBottomWidth: 0.5, borderBottomColor: C.line, borderBottomStyle: 'solid', alignItems: 'center' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 4.5, paddingHorizontal: 5, backgroundColor: C.zebra, borderBottomWidth: 0.5, borderBottomColor: C.line, borderBottomStyle: 'solid', alignItems: 'center' },
  tableCell: { fontSize: 8, color: C.body },
  statusCellBold: { fontSize: 8, fontFamily: 'Helvetica-Bold' },

  /* Detail card */
  detailCard: { border: 0.75, borderColor: C.line, borderRadius: 8, padding: 16, backgroundColor: '#FFFFFF' },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: C.primaryDark, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Helvetica-Bold' },
  detailName: { fontSize: 15, fontFamily: 'Helvetica-Bold', color: C.ink },
  chipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  chip: { borderWidth: 0.75, borderColor: C.line, borderRadius: 4, paddingVertical: 1.5, paddingHorizontal: 5, marginRight: 6, backgroundColor: C.zebra },
  chipText: { fontSize: 6.5, fontFamily: 'Courier', color: C.muted },
  statusPill: { marginLeft: 'auto', borderRadius: 9, paddingVertical: 3, paddingHorizontal: 9 },
  statusPillText: { fontSize: 7, fontFamily: 'Helvetica-Bold', letterSpacing: 0.5 },

  sectionHeadingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, marginBottom: 6 },
  sectionAccent: { width: 3, height: 9, backgroundColor: C.primary, marginRight: 5 },
  sectionHeading: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.primaryDark, letterSpacing: 1 },

  fieldColWrap: { flexDirection: 'row' },
  fieldCol: { width: '50%' },
  fieldColPad: { paddingRight: 18 },
  fieldRow: { marginBottom: 4.5 },
  fieldLabel: { fontSize: 6.5, fontFamily: 'Helvetica-Bold', color: C.muted, letterSpacing: 0.7, marginBottom: 1 },
  fieldValue: { fontSize: 8.5, color: C.body },

  /* Doc table inside detail */
  docTableHeader: { flexDirection: 'row', backgroundColor: C.slateBg, paddingVertical: 4, paddingHorizontal: 5, marginTop: 2 },
  docTableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: C.muted },
  docTableRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 5, borderBottomWidth: 0.5, borderBottomColor: C.line, borderBottomStyle: 'solid', alignItems: 'center' },
  docTableCell: { fontSize: 7.5, color: C.body },
  docStatusVerified: { fontSize: 7.5, color: C.green, fontFamily: 'Helvetica-Bold' },
  docStatusPending: { fontSize: 7.5, color: C.amber, fontFamily: 'Helvetica-Bold' },
  docStatusRejected: { fontSize: 7.5, color: C.red, fontFamily: 'Helvetica-Bold' },
  docStatusOther: { fontSize: 7.5, color: C.muted },

  enrollRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3, paddingLeft: 2 },
  enrollCourse: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: C.ink, marginRight: 5 },
  enrollStatus: { fontSize: 8, fontFamily: 'Helvetica-Bold' },
  enrollDate: { fontSize: 7.5, color: C.muted },

  footerLeft: { position: 'absolute', bottom: 20, left: pageMargin, fontSize: 7, color: C.faint },
  footerRight: { position: 'absolute', bottom: 20, right: pageMargin, fontSize: 7, color: C.faint },
});

const COL_WIDTHS = TABLE_COLS.map(c => c.width);

function docStatusStyle(status: string) {
  if (status === 'verified') return pdfStyles.docStatusVerified;
  if (status === 'pending' || status === 'not_uploaded') return pdfStyles.docStatusPending;
  if (status === 'rejected') return pdfStyles.docStatusRejected;
  return pdfStyles.docStatusOther;
}

/* Branded page band */
const OrgBand = () => (
  <View style={pdfStyles.band}>
    <View style={pdfStyles.bandRow}>
      <View>
        <Text style={pdfStyles.orgName}>{ORG_NAME.toUpperCase()}</Text>
        <Text style={pdfStyles.orgSub}>{ORG_SUB.toUpperCase()}</Text>
      </View>
      <Text style={pdfStyles.bandMeta}>Generated {generatedAt()}</Text>
    </View>
  </View>
);

/* Footer with page numbers */
const PageFooter = () => (
  <>
    <Text style={pdfStyles.footerLeft} fixed>
      Confidential — {ORG_NAME} / {ORG_SUB}
    </Text>
    <Text style={pdfStyles.footerRight} fixed render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} />
  </>
);

/* Summary table header */
const SummaryHeader = () => (
  <View style={pdfStyles.tableHeader} fixed>
    {TABLE_COLS.map((col) => (
      <Text key={col.key} style={[pdfStyles.tableHeaderText, { width: col.width }]}>{col.label.toUpperCase()}</Text>
    ))}
  </View>
);

/* Single member row in the summary table */
const SummaryRow = ({ m, index }: { m: ExportableMember; index: number }) => {
  const rowStyle = index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt;
  const values = summaryValues(m);
  const tone = memberTone(String(m.status ?? ''));
  const statusIdx = TABLE_COLS.findIndex(c => c.key === 'status');
  return (
    <View style={rowStyle} wrap={false}>
      {values.map((val, i) => (
        <Text
          key={i}
          style={i === statusIdx
            ? { ...pdfStyles.statusCellBold, width: COL_WIDTHS[i], color: toneColor(tone) }
            : { ...pdfStyles.tableCell, width: COL_WIDTHS[i] }}
        >
          {val}
        </Text>
      ))}
    </View>
  );
};

/* One field cell (label above value) */
const FieldPair = ({ f, m }: { f: string; m: ExportableMember }) => (
  <View style={pdfStyles.fieldRow}>
    <Text style={pdfStyles.fieldLabel}>{fieldLabel(f).toUpperCase()}</Text>
    <Text style={pdfStyles.fieldValue}>{formatField(m, f)}</Text>
  </View>
);

/* Two-column field grid */
const FieldGrid = ({ fields: secFields, m }: { fields: string[]; m: ExportableMember }) => {
  const mid = Math.ceil(secFields.length / 2);
  const left = secFields.slice(0, mid);
  const right = secFields.slice(mid);
  return (
    <View style={pdfStyles.fieldColWrap}>
      <View style={[pdfStyles.fieldCol, pdfStyles.fieldColPad]}>
        {left.map(f => <FieldPair key={f} f={f} m={m} />)}
      </View>
      <View style={pdfStyles.fieldCol}>
        {right.map(f => <FieldPair key={f} f={f} m={m} />)}
      </View>
    </View>
  );
};

/* Section heading with accent bar */
const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <View style={pdfStyles.sectionHeadingRow}>
    <View style={pdfStyles.sectionAccent} />
    <Text style={pdfStyles.sectionHeading}>{String(children).toUpperCase()}</Text>
  </View>
);

/* Detail section for a single member */
const DetailSection = ({ m, selectedFields }: { m: ExportableMember; selectedFields: string[] }) => {
  const docs = (m.documents as { type: string; label: string; status: string; verifiedBy?: string | null; rejectionReason?: string | null }[]) ?? [];
  const enrs = (m.enrollments as { courseTitle: string; status: string; completionDate: string | null }[]) ?? [];
  const sections = selectedSections(selectedFields);
  const tone = memberTone(String(m.status ?? ''));

  return (
    <View style={pdfStyles.detailCard} wrap={false}>
      {/* Card header */}
      <View style={pdfStyles.cardHeadRow}>
        <View style={pdfStyles.avatar}>
          <Text style={pdfStyles.avatarText}>{initialsOf(fv(m, 'fullName'))}</Text>
        </View>
        <View>
          <Text style={pdfStyles.detailName}>{fv(m, 'fullName')}</Text>
          <View style={pdfStyles.chipRow}>
            <View style={pdfStyles.chip}>
              <Text style={pdfStyles.chipText}>ID {String(m.id ?? '')}</Text>
            </View>
          </View>
        </View>
        <View style={[pdfStyles.statusPill, { backgroundColor: toneBg(tone), alignSelf: 'flex-start', marginLeft: 'auto' }]}>
          <Text style={[pdfStyles.statusPillText, { color: toneColor(tone) }]}>{fv(m, 'status').toUpperCase()}</Text>
        </View>
      </View>

      {/* Selected field sections */}
      {sections.map(([heading, secFields]) => (
        <View key={heading}>
          <SectionHeading>{heading}</SectionHeading>
          <FieldGrid fields={secFields} m={m} />
        </View>
      ))}

      {/* Documents */}
      {docs.length > 0 && (
        <View>
          <SectionHeading>Documents</SectionHeading>
          <View style={pdfStyles.docTableHeader}>
            <Text style={[pdfStyles.docTableHeaderText, { width: 150 }]}>TYPE</Text>
            <Text style={[pdfStyles.docTableHeaderText, { width: 90 }]}>STATUS</Text>
            <Text style={[pdfStyles.docTableHeaderText, { width: 130 }]}>VERIFIED BY</Text>
            <Text style={[pdfStyles.docTableHeaderText, { flex: 1 }]}>REJECTION REASON</Text>
          </View>
          {docs.map((d, i) => (
            <View key={i} style={pdfStyles.docTableRow}>
              <Text style={[pdfStyles.docTableCell, { width: 150 }]}>{d.label} ({d.type})</Text>
              <Text style={docStatusStyle(d.status)}>{docStatusText(d.status)}</Text>
              <Text style={[pdfStyles.docTableCell, { width: 130 }]}>{d.verifiedBy || NOT_PROVIDED}</Text>
              <Text style={[pdfStyles.docTableCell, { flex: 1 }]}>{d.rejectionReason || NOT_PROVIDED}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Enrollments */}
      {enrs.length > 0 && (
        <View>
          <SectionHeading>Course Enrollments</SectionHeading>
          {enrs.map((e, i) => {
            const tone2 = memberTone(e.status);
            return (
              <View key={i} style={pdfStyles.enrollRow}>
                <Text style={pdfStyles.enrollCourse}>{e.courseTitle}</Text>
                <Text style={[pdfStyles.enrollStatus, { color: toneColor(tone2), marginRight: 5 }]}>{docStatusText(e.status)}</Text>
                {e.completionDate ? <Text style={pdfStyles.enrollDate}>Completed {e.completionDate}</Text> : null}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const PDFDoc = ({ members, fields }: { members: ExportableMember[]; fields: string[] }) => {
  // Split summary rows into pages of ~36 rows each
  const ROWS_PER_PAGE = 36;
  const summaryPages: ExportableMember[][] = [];
  for (let i = 0; i < members.length; i += ROWS_PER_PAGE) {
    summaryPages.push(members.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <RPDFDocument>
      {/* Summary table pages */}
      {summaryPages.map((pageMembers, pi) => (
        <Page key={`summary-${pi}`} size={[pageWidth, pageHeight]} style={{ padding: pageMargin }}>
          <OrgBand />
          {pi === 0 && (
            <>
              <Text style={pdfStyles.title}>{DOC_TITLE}</Text>
              <Text style={pdfStyles.subtitle}>
                {members.length} record{members.length !== 1 ? 's' : ''} · Summary & Detailed Profiles
              </Text>
            </>
          )}
          {pi > 0 && (
            <Text style={pdfStyles.subtitle}>Summary (continued)</Text>
          )}
          <SummaryHeader />
          {pageMembers.map((m, i) => (
            <SummaryRow key={i} m={m} index={pi * ROWS_PER_PAGE + i} />
          ))}
          <PageFooter />
        </Page>
      ))}

      {/* Detail pages */}
      {members.map((m, i) => (
        <Page key={`detail-${i}`} size={[pageWidth, pageHeight]} style={{ padding: pageMargin }} wrap>
          <OrgBand />
          <DetailSection m={m} selectedFields={fields} />
          <PageFooter />
        </Page>
      ))}
    </RPDFDocument>
  );
};

export async function exportPDF(members: ExportableMember[], fields: string[]) {
  const doc = <PDFDoc members={members} fields={fields} />;
  const blob = await pdf(doc).toBlob();
  downloadBlob(blob, `Beneficiary_Dossier_Export_${dateStamp()}.pdf`);
}

// ============================================================================
// DOCX EXPORT — landscape, branded header/footer, styled tables
// ============================================================================

const TOTAL_COL_WIDTH = TABLE_COLS.reduce((a, b) => a + b.width, 0);
const colPercent = (w: number) => Math.round((w / TOTAL_COL_WIDTH) * 10000) / 100;

const LIGHT_BORDER = { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' };
const GRID_BORDERS = {
  top: LIGHT_BORDER,
  bottom: LIGHT_BORDER,
  left: LIGHT_BORDER,
  right: LIGHT_BORDER,
  insideHorizontal: LIGHT_BORDER,
  insideVertical: LIGHT_BORDER,
};
const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const NO_BORDERS = {
  top: NO_BORDER,
  bottom: NO_BORDER,
  left: NO_BORDER,
  right: NO_BORDER,
  insideHorizontal: NO_BORDER,
  insideVertical: NO_BORDER,
};

const FONT = 'Calibri';

function hexOf(tone: ToneKey): string {
  if (tone === 'green') return '15803D';
  if (tone === 'amber') return 'B45309';
  if (tone === 'red') return 'B91C1C';
  return '475569';
}

function makeDocxSummaryTable(members: ExportableMember[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: TABLE_COLS.map(col =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: col.label.toUpperCase(), bold: true, size: 15, font: FONT, color: 'FFFFFF' })] })],
        width: { size: colPercent(col.width), type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: '1E40AF' },
        verticalAlign: VerticalAlign.CENTER,
      })
    ),
  });

  const dataRows = members.map((m, idx) => {
    const values = summaryValues(m);
    const tone = memberTone(String(m.status ?? ''));
    const statusIdx = TABLE_COLS.findIndex(c => c.key === 'status');
    const fill = idx % 2 === 1 ? 'F8FAFC' : undefined;
    return new TableRow({
      children: values.map((val, i) =>
        new TableCell({
          children: [new Paragraph({
            children: [new TextRun(
              i === statusIdx
                ? { text: val, size: 16, font: FONT, bold: true, color: hexOf(tone) }
                : { text: val, size: 16, font: FONT, color: '334155' }
            )],
          })],
          width: { size: colPercent(TABLE_COLS[i].width), type: WidthType.PERCENTAGE },
          shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
          verticalAlign: VerticalAlign.CENTER,
        })
      ),
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: GRID_BORDERS,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
  });
}

/* Two-column invisible layout table for a section's fields */
function makeDocxFieldGrid(sectionFields: string[], m: ExportableMember): Table {
  const mkPara = (f: string) => new Paragraph({
    spacing: { after: 50 },
    children: [
      new TextRun({ text: `${fieldLabel(f).toUpperCase()}`, bold: true, size: 13, font: FONT, color: '64748B' }),
      new TextRun({ break: 1 }),
      new TextRun({ text: formatField(m, f), size: 17, font: FONT, color: '334155' }),
    ],
  });

  const mid = Math.ceil(sectionFields.length / 2);
  const left = sectionFields.slice(0, mid);
  const right = sectionFields.slice(mid);

  return new Table({
    borders: NO_BORDERS,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [new TableRow({
      children: [
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, margins: { top: 20, bottom: 20, left: 0, right: 200 }, children: left.map(mkPara) }),
        new TableCell({ width: { size: 50, type: WidthType.PERCENTAGE }, margins: { top: 20, bottom: 20, left: 0, right: 0 }, children: right.length > 0 ? right.map(mkPara) : [new Paragraph({})] }),
      ],
    })],
  });
}

export async function exportDOCX(members: ExportableMember[], fields: string[]) {
  const hasRecords = members.length > 0;
  const summaryTable = hasRecords ? makeDocxSummaryTable(members) : null;

  const detailChildren: (Paragraph | Table)[] = [];

  members.forEach((m, idx) => {
    const docs = (m.documents as { type: string; label: string; status: string; verifiedBy?: string | null; rejectionReason?: string | null }[]) ?? [];
    const enrs = (m.enrollments as { courseTitle: string; status: string; completionDate: string | null }[]) ?? [];
    const sections = selectedSections(fields);
    const tone = memberTone(String(m.status ?? ''));

    // Numbered member header
    detailChildren.push(new Paragraph({
      children: [
        new TextRun({ text: `${idx + 1}.  `, bold: true, size: 28, font: FONT, color: '94A3B8' }),
        new TextRun({ text: fv(m, 'fullName'), bold: true, size: 28, font: FONT, color: '0F172A' }),
        new TextRun({ text: `   ${fv(m, 'status').toUpperCase()}`, bold: true, size: 15, font: FONT, color: hexOf(tone) }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: idx === 0 ? 60 : 240, after: 30 },
    }));
    detailChildren.push(new Paragraph({
      children: [new TextRun({ text: `ID ${String(m.id ?? '')}`, size: 15, font: 'Courier New', color: '94A3B8' })],
      border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' } },
      spacing: { after: 140 },
    }));

    // Sections with two-column grids
    for (const [heading, secFields] of sections) {
      detailChildren.push(new Paragraph({
        children: [new TextRun({ text: heading.toUpperCase(), bold: true, size: 19, font: FONT, color: '1E3A8A' })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'BFDBFE' } },
      }));
      detailChildren.push(makeDocxFieldGrid(secFields, m));
    }

    // Documents
    if (docs.length > 0) {
      detailChildren.push(new Paragraph({
        children: [new TextRun({ text: 'DOCUMENTS', bold: true, size: 19, font: FONT, color: '1E3A8A' })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'BFDBFE' } },
      }));
      for (const d of docs) {
        const statusHex = d.status === 'verified' ? '15803D' : d.status === 'rejected' ? 'B91C1C' : d.status === 'pending' || d.status === 'not_uploaded' ? 'B45309' : '64748B';
        detailChildren.push(new Paragraph({
          children: [
            new TextRun({ text: `${d.label} (${d.type}): `, bold: true, size: 17, font: FONT, color: '475569' }),
            new TextRun({ text: docStatusText(d.status), bold: true, size: 17, font: FONT, color: statusHex }),
            new TextRun({ text: d.verifiedBy ? ` — Verified by ${d.verifiedBy}` : '', size: 17, font: FONT, color: '64748B' }),
            new TextRun({ text: d.rejectionReason ? ` — Reason: ${d.rejectionReason}` : '', size: 17, font: FONT, color: 'B91C1C' }),
          ],
          spacing: { after: 30 },
        }));
      }
    }

    // Enrollments
    if (enrs.length > 0) {
      detailChildren.push(new Paragraph({
        children: [new TextRun({ text: 'COURSE ENROLLMENTS', bold: true, size: 19, font: FONT, color: '1E3A8A' })],
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 160, after: 80 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: 'BFDBFE' } },
      }));
      for (const e of enrs) {
        const eHex = hexOf(memberTone(e.status));
        detailChildren.push(new Paragraph({
          children: [
            new TextRun({ text: e.courseTitle, bold: true, size: 17, font: FONT, color: '0F172A' }),
            new TextRun({ text: `  ${docStatusText(e.status)}`, bold: true, size: 17, font: FONT, color: eHex }),
            ...(e.completionDate ? [new TextRun({ text: ` — Completed ${e.completionDate}`, size: 15, font: FONT, color: '64748B' })] : []),
          ],
          spacing: { after: 30 },
        }));
      }
    }
  });

  const pageHeader = new Header({
    children: [new Paragraph({
      children: [
        new TextRun({ text: ORG_NAME.toUpperCase(), bold: true, size: 17, font: FONT, color: '1E3A8A' }),
        new TextRun({ text: `   ·   ${ORG_SUB.toUpperCase()}`, size: 13, font: FONT, color: '94A3B8' }),
        new TextRun({ text: `\tGenerated ${generatedAt()}`, size: 13, font: FONT, color: '64748B' }),
      ],
      tabStops: [{ type: 'right' as const, position: 15000 }],
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E40AF' } },
      spacing: { after: 0 },
    })],
  });

  const pageFooter = new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' } },
      spacing: { before: 60 },
      children: [
        new TextRun({ text: `Confidential — ${ORG_NAME} / ${ORG_SUB}    ·    Page `, italics: true, size: 14, font: FONT, color: '94A3B8' }),
        new TextRun({ children: [PageNumber.CURRENT], italics: true, size: 14, font: FONT, color: '94A3B8' }),
        new TextRun({ text: ' of ', italics: true, size: 14, font: FONT, color: '94A3B8' }),
        new TextRun({ children: [PageNumber.TOTAL_PAGES], italics: true, size: 14, font: FONT, color: '94A3B8' }),
      ],
    })],
  });

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE },
        },
      },
      headers: { default: pageHeader },
      footers: { default: pageFooter },
      children: [
        // Title block
        new Paragraph({
          children: [new TextRun({ text: DOC_TITLE, bold: true, size: 40, font: FONT, color: '0F172A' })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: hasRecords
              ? `${members.length} record${members.length !== 1 ? 's' : ''} · Generated ${generatedAt()}`
              : 'No records match the current selection.',
            size: 19, font: FONT, color: '64748B',
          })],
          border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: '1E40AF' } },
          spacing: { after: 200 },
        }),

        // Summary section
        new Paragraph({
          children: [new TextRun({ text: 'SUMMARY', bold: true, size: 24, font: FONT, color: '1E3A8A' })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 100 },
        }),
        ...(summaryTable ? [summaryTable] : []),

        // Detailed records
        new Paragraph({
          spacing: { before: 360, after: 100 },
          border: { top: { style: BorderStyle.SINGLE, size: 8, color: '1E40AF' } },
          children: [new TextRun({ text: 'DETAILED RECORDS', bold: true, size: 24, font: FONT, color: '1E3A8A' })],
          heading: HeadingLevel.HEADING_1,
        }),
        ...detailChildren,
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `Beneficiary_Dossier_Export_${dateStamp()}.docx`);
}
