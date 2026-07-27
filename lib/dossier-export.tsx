import React from 'react';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, Table, TableRow, TableCell, WidthType, AlignmentType, ShadingType, VerticalAlign, PageOrientation } from 'docx';
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
  downloadBlob(blob, 'Beneficiary_Dossier_Export.csv');
}

// ============================================================================
// PDF EXPORT — landscape, summary table + detail sections
// ============================================================================

const pageWidth = 841.89;
const pageHeight = 595.28;
const pageMargin = 40;

const pdfStyles = StyleSheet.create({
  page: { padding: pageMargin, fontSize: 9, fontFamily: 'Helvetica', width: pageWidth, height: pageHeight },
  title: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 4, color: '#1e293b' },
  subtitle: { fontSize: 10, color: '#64748b', marginBottom: 20 },

  /* Summary table */
  tableHeader: { flexDirection: 'row', backgroundColor: '#1e40af', paddingVertical: 5, paddingHorizontal: 4 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#ffffff' },
  tableRow: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', borderBottomStyle: 'solid' },
  tableRowAlt: { flexDirection: 'row', paddingVertical: 4, paddingHorizontal: 4, backgroundColor: '#f8fafc', borderBottomWidth: 0.5, borderBottomColor: '#e2e8f0', borderBottomStyle: 'solid' },
  tableCell: { fontSize: 8, color: '#1e293b' },

  /* Detail sections */
  detailPageBreak: { paddingTop: 0 },
  detailName: { fontSize: 16, fontFamily: 'Helvetica-Bold', marginBottom: 2, color: '#0f172a' },
  detailId: { fontSize: 8, color: '#94a3b8', marginBottom: 12 },
  sectionHeading: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: '#1e40af', marginTop: 10, marginBottom: 5, paddingBottom: 3, borderBottomWidth: 1, borderBottomColor: '#bfdbfe', borderBottomStyle: 'solid' },
  fieldRow: { flexDirection: 'row', marginBottom: 2 },
  fieldLabel: { width: 130, fontFamily: 'Helvetica-Bold', color: '#475569', fontSize: 8 },
  fieldValue: { flex: 1, color: '#1e293b', fontSize: 8 },

  /* Doc table inside detail */
  docTableHeader: { flexDirection: 'row', backgroundColor: '#f1f5f9', paddingVertical: 3, paddingHorizontal: 4, marginTop: 6 },
  docTableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#475569' },
  docTableRow: { flexDirection: 'row', paddingVertical: 3, paddingHorizontal: 4, borderBottomWidth: 0.5, borderBottomColor: '#f1f5f9', borderBottomStyle: 'solid' },
  docTableCell: { fontSize: 7, color: '#1e293b' },
  docStatusVerified: { fontSize: 7, color: '#16a34a', fontFamily: 'Helvetica-Bold' },
  docStatusPending: { fontSize: 7, color: '#d97706', fontFamily: 'Helvetica-Bold' },
  docStatusRejected: { fontSize: 7, color: '#dc2626', fontFamily: 'Helvetica-Bold' },
  docStatusOther: { fontSize: 7, color: '#6b7280' },

  enrollRow: { marginBottom: 2, paddingLeft: 4, fontSize: 8, color: '#1e293b' },
  footer: { position: 'absolute', bottom: 20, left: pageMargin, right: pageMargin, fontSize: 7, color: '#94a3b8', textAlign: 'center', borderTopWidth: 0.5, borderTopColor: '#e2e8f0', borderTopStyle: 'solid', paddingTop: 6 },
});

const COL_WIDTHS = TABLE_COLS.map(c => c.width);
const TOTAL_TABLE_WIDTH = COL_WIDTHS.reduce((a, b) => a + b, 0);

function docStatusStyle(status: string) {
  if (status === 'verified') return pdfStyles.docStatusVerified;
  if (status === 'pending' || status === 'not_uploaded') return pdfStyles.docStatusPending;
  if (status === 'rejected') return pdfStyles.docStatusRejected;
  return pdfStyles.docStatusOther;
}

// Summary table header
const SummaryHeader = () => (
  <View style={pdfStyles.tableHeader} fixed>
    {TABLE_COLS.map((col) => (
      <Text key={col.key} style={[pdfStyles.tableHeaderText, { width: col.width }]}>{col.label}</Text>
    ))}
  </View>
);

// Single member row in the summary table
const SummaryRow = ({ m, index }: { m: ExportableMember; index: number }) => {
  const rowStyle = index % 2 === 0 ? pdfStyles.tableRow : pdfStyles.tableRowAlt;
  const values = [
    fv(m, 'fullName'),
    fv(m, 'age'),
    fv(m, 'gender'),
    fv(m, 'category'),
    fv(m, 'village'),
    fv(m, 'district'),
    fv(m, 'status'),
    docsVerifiedText(m),
  ];
  return (
    <View style={rowStyle} wrap={false}>
      {values.map((val, i) => (
        <Text key={i} style={[pdfStyles.tableCell, { width: COL_WIDTHS[i] }]}>{val}</Text>
      ))}
    </View>
  );
};

// Detail section for a single member
const DetailSection = ({ m, selectedFields }: { m: ExportableMember; selectedFields: string[] }) => {
  const docs = (m.documents as { type: string; label: string; status: string; verifiedBy?: string | null; rejectionReason?: string | null }[]) ?? [];
  const enrs = (m.enrollments as { courseTitle: string; status: string; completionDate: string | null }[]) ?? [];

  const sectionMap = new Map<string, string[]>();
  for (const sec of SECTIONS) {
    const secFields = sec.fields.filter(f => selectedFields.includes(f));
    if (secFields.length > 0) sectionMap.set(sec.heading, secFields);
  }

  return (
    <View wrap={false}>
      <Text style={pdfStyles.detailName}>{fv(m, 'fullName')}</Text>
      <Text style={pdfStyles.detailId}>ID: {String(m.id ?? '')}</Text>

      {Array.from(sectionMap.entries()).map(([heading, fields]) => (
        <View key={heading}>
          <Text style={pdfStyles.sectionHeading}>{heading}</Text>
          {fields.map(f => (
            <View key={f} style={pdfStyles.fieldRow}>
              <Text style={pdfStyles.fieldLabel}>{fieldLabel(f)}</Text>
              <Text style={pdfStyles.fieldValue}>{formatField(m, f)}</Text>
            </View>
          ))}
        </View>
      ))}

      {docs.length > 0 && (
        <View>
          <Text style={pdfStyles.sectionHeading}>Documents</Text>
          <View style={pdfStyles.docTableHeader}>
            <Text style={[pdfStyles.docTableHeaderText, { width: 130 }]}>Type</Text>
            <Text style={[pdfStyles.docTableHeaderText, { width: 100 }]}>Status</Text>
            <Text style={[pdfStyles.docTableHeaderText, { width: 130 }]}>Verified By</Text>
            <Text style={[pdfStyles.docTableHeaderText, { flex: 1 }]}>Rejection Reason</Text>
          </View>
          {docs.map((d, i) => (
            <View key={i} style={pdfStyles.docTableRow}>
              <Text style={[pdfStyles.docTableCell, { width: 130 }]}>{d.label} ({d.type})</Text>
              <Text style={docStatusStyle(d.status)}>{docStatusText(d.status)}</Text>
              <Text style={[pdfStyles.docTableCell, { width: 130 }]}>{d.verifiedBy || NOT_PROVIDED}</Text>
              <Text style={[pdfStyles.docTableCell, { flex: 1 }]}>{d.rejectionReason || NOT_PROVIDED}</Text>
            </View>
          ))}
        </View>
      )}

      {enrs.length > 0 && (
        <View>
          <Text style={pdfStyles.sectionHeading}>Course Enrollments</Text>
          {enrs.map((e, i) => (
            <Text key={i} style={pdfStyles.enrollRow}>
              {e.courseTitle} — {e.status}{e.completionDate ? ` (${e.completionDate})` : ''}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const PDFDoc = ({ members, fields }: { members: ExportableMember[]; fields: string[] }) => {
  // Split summary rows into pages of ~40 rows each
  const ROWS_PER_PAGE = 40;
  const summaryPages: ExportableMember[][] = [];
  for (let i = 0; i < members.length; i += ROWS_PER_PAGE) {
    summaryPages.push(members.slice(i, i + ROWS_PER_PAGE));
  }

  return (
    <RPDFDocument>
      {/* Summary table pages */}
      {summaryPages.map((pageMembers, pi) => (
        <Page key={`summary-${pi}`} size={[pageWidth, pageHeight]} style={pdfStyles.page}>
          {pi === 0 && (
            <>
              <Text style={pdfStyles.title}>Beneficiary Dossier Export</Text>
              <Text style={pdfStyles.subtitle}>
                {members.length} record{members.length !== 1 ? 's' : ''} — Generated {new Date().toLocaleDateString('en-IN')} — Summary
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
          <Text style={pdfStyles.footer} fixed>
            Confidential — CompassionGlobal / Rupasri Mahila Vikas Sanstha
          </Text>
        </Page>
      ))}

      {/* Detail pages */}
      {members.map((m, i) => (
        <Page key={`detail-${i}`} size={[pageWidth, pageHeight]} style={pdfStyles.page}>
          <DetailSection m={m} selectedFields={fields} />
          <Text style={pdfStyles.footer} fixed>
            Confidential — CompassionGlobal / Rupasri Mahila Vikas Sanstha
          </Text>
        </Page>
      ))}
    </RPDFDocument>
  );
};

export async function exportPDF(members: ExportableMember[], fields: string[]) {
  const doc = <PDFDoc members={members} fields={fields} />;
  const blob = await pdf(doc).toBlob();
  downloadBlob(blob, 'Beneficiary_Dossier_Export.pdf');
}

// ============================================================================
// DOCX EXPORT — landscape, summary table + detail sections
// ============================================================================

const COL_LABELS = TABLE_COLS.map(c => c.label);
const COL_TWIPS = TABLE_COLS.map(c => Math.round(c.width * 14)); // ~14 twips per PDF point

function makeDocxSummaryTable(members: ExportableMember[]): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: COL_LABELS.map((label, i) =>
      new TableCell({
        children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 16, font: 'Calibri', color: 'FFFFFF' })] })],
        width: { size: COL_TWIPS[i], type: WidthType.DXA },
        shading: { type: ShadingType.CLEAR, fill: '1E40AF' },
        verticalAlign: VerticalAlign.CENTER,
      })
    ),
  });

  const dataRows = members.map((m, idx) => {
    const values = [
      fv(m, 'fullName'),
      fv(m, 'age'),
      fv(m, 'gender'),
      fv(m, 'category'),
      fv(m, 'village'),
      fv(m, 'district'),
      fv(m, 'status'),
      docsVerifiedText(m),
    ];
    const fill = idx % 2 === 0 ? undefined : 'F8FAFC';
    return new TableRow({
      children: values.map((val, i) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: val, size: 16, font: 'Calibri', color: '1E293B' })] })],
          width: { size: COL_TWIPS[i], type: WidthType.DXA },
          shading: fill ? { type: ShadingType.CLEAR, fill } : undefined,
          verticalAlign: VerticalAlign.CENTER,
        })
      ),
    });
  });

  return new Table({
    rows: [headerRow, ...dataRows],
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

function makeDocxDetailSections(m: ExportableMember, fields: string[]): Paragraph[] {
  const children: Paragraph[] = [];
  const docs = (m.documents as { type: string; label: string; status: string; verifiedBy?: string | null; rejectionReason?: string | null }[]) ?? [];
  const enrs = (m.enrollments as { courseTitle: string; status: string; completionDate: string | null }[]) ?? [];

  const sectionMap = new Map<string, string[]>();
  for (const sec of SECTIONS) {
    const secFields = sec.fields.filter(f => fields.includes(f));
    if (secFields.length > 0) sectionMap.set(sec.heading, secFields);
  }

  // Member header
  children.push(new Paragraph({
    children: [new TextRun({ text: fv(m, 'fullName'), bold: true, size: 28, font: 'Calibri', color: '0F172A' })],
    heading: HeadingLevel.HEADING_2,
    spacing: { after: 40 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: `ID: ${String(m.id ?? '')}`, size: 16, font: 'Calibri', color: '94A3B8' })],
    spacing: { after: 120 },
  }));

  // Sections
  for (const [heading, secFields] of sectionMap) {
    children.push(new Paragraph({
      children: [new TextRun({ text: heading, bold: true, size: 22, font: 'Calibri', color: '1E40AF' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 160, after: 60 },
    }));

    for (const f of secFields) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${fieldLabel(f)}: `, bold: true, size: 18, font: 'Calibri', color: '475569' }),
          new TextRun({ text: formatField(m, f), size: 18, font: 'Calibri', color: '1E293B' }),
        ],
        spacing: { after: 30 },
      }));
    }
  }

  // Documents
  if (docs.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Documents', bold: true, size: 22, font: 'Calibri', color: '1E40AF' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 160, after: 60 },
    }));
    for (const d of docs) {
      const statusColor = d.status === 'verified' ? '16A34A' : d.status === 'rejected' ? 'DC2626' : d.status === 'pending' || d.status === 'not_uploaded' ? 'D97706' : '6B7280';
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${d.label} (${d.type}): `, bold: true, size: 18, font: 'Calibri', color: '475569' }),
          new TextRun({ text: docStatusText(d.status), size: 18, font: 'Calibri', color: statusColor }),
          new TextRun({ text: d.verifiedBy ? ` — Verified by ${d.verifiedBy}` : '', size: 18, font: 'Calibri', color: '64748B' }),
          new TextRun({ text: d.rejectionReason ? ` — Reason: ${d.rejectionReason}` : '', size: 18, font: 'Calibri', color: 'DC2626' }),
        ],
        spacing: { after: 30 },
      }));
    }
  }

  // Enrollments
  if (enrs.length > 0) {
    children.push(new Paragraph({
      children: [new TextRun({ text: 'Course Enrollments', bold: true, size: 22, font: 'Calibri', color: '1E40AF' })],
      heading: HeadingLevel.HEADING_3,
      spacing: { before: 160, after: 60 },
    }));
    for (const e of enrs) {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: `${e.courseTitle} — ${e.status}`, size: 18, font: 'Calibri', color: '1E293B' }),
          ...(e.completionDate ? [new TextRun({ text: ` (${e.completionDate})`, size: 18, font: 'Calibri', color: '64748B' })] : []),
        ],
        spacing: { after: 30 },
      }));
    }
  }

  // Separator
  children.push(new Paragraph({
    spacing: { before: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: 'E2E8F0' } },
    children: [],
  }));

  return children;
}

export async function exportDOCX(members: ExportableMember[], fields: string[]) {
  const summaryTable = makeDocxSummaryTable(members);
  const detailChildren = members.flatMap(m => makeDocxDetailSections(m, fields));

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { orientation: PageOrientation.LANDSCAPE },
        },
      },
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Beneficiary Dossier Export', bold: true, size: 36, font: 'Calibri', color: '1E293B' })],
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 60 },
        }),
        new Paragraph({
          children: [new TextRun({
            text: `${members.length} record${members.length !== 1 ? 's' : ''} — Generated ${new Date().toLocaleDateString('en-IN')} — Summary`,
            size: 20, font: 'Calibri', color: '64748B',
          })],
          spacing: { after: 120 },
        }),
        summaryTable,
        new Paragraph({
          spacing: { before: 300 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: '1E40AF' } },
          children: [new TextRun({ text: 'Detailed Records', bold: true, size: 28, font: 'Calibri', color: '1E40AF' })],
          heading: HeadingLevel.HEADING_1,
        }),
        ...detailChildren,
        new Paragraph({
          children: [new TextRun({ text: 'Confidential — CompassionGlobal / Rupasri Mahila Vikas Sanstha', size: 16, font: 'Calibri', color: '94A3B8', italics: true })],
          spacing: { before: 200 },
          alignment: AlignmentType.CENTER,
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, 'Beneficiary_Dossier_Export.docx');
}
