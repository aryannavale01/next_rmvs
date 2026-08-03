import QRCode from "qrcode";
import { pdf, Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import { renderCertificatePdfBuffers } from "./certificate-html";

export interface CertificatePdfData {
  certificateNumber: string;
  fullName: string;
  courseTitle: string;
  teacherName: string | null;
  batch: string | null;
  completionDate: string | null;
  issueDate: string | null;
  verificationUrl: string | null;
  language: string;
  qrDataUrl?: string;
}

const NOT_PROVIDED = "—";

function formatDate(value: string | null | undefined): string {
  if (!value) return NOT_PROVIDED;
  try {
    return new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
  } catch {
    return value;
  }
}

export function buildVerificationUrl(baseUrl: string, certificateNumber: string): string {
  const origin = baseUrl.replace(/\/+$/, "");
  return `${origin}/verify/certificate/${encodeURIComponent(certificateNumber)}`;
}

// Landscape A4
const pageWidth = 841.89;
const pageHeight = 595.28;

const styles = StyleSheet.create({
  page: {
    width: pageWidth,
    height: pageHeight,
    padding: 26,
    backgroundColor: "#ffffff",
    fontFamily: "Helvetica",
  },
  frame: {
    flex: 1,
    borderWidth: 2.5,
    borderColor: "#1e3a5f",
    borderRadius: 10,
    paddingHorizontal: 44,
    paddingVertical: 32,
  },
  innerFrame: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#c7d2e0",
    borderRadius: 6,
    paddingHorizontal: 34,
    paddingVertical: 26,
    position: "relative",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 22,
  },
  orgMark: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: "#1e3a5f",
    alignItems: "center",
    justifyContent: "center",
  },
  orgMarkText: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  orgName: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    letterSpacing: 2,
  },
  orgTag: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  certNumber: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#94a3b8",
    textAlign: "right",
  },
  certTitle: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1e3a5f",
    textAlign: "center",
    letterSpacing: 5,
    marginBottom: 6,
  },
  certSubtitle: {
    fontSize: 9,
    color: "#64748b",
    textAlign: "center",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    marginBottom: 22,
  },
  certified: {
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
    marginBottom: 10,
  },
  name: {
    fontSize: 30,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 12,
  },
  completed: {
    fontSize: 11,
    color: "#475569",
    textAlign: "center",
    marginBottom: 12,
  },
  course: {
    fontSize: 19,
    fontFamily: "Helvetica-Bold",
    color: "#b45309",
    textAlign: "center",
    marginBottom: 20,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  detailBox: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 6,
    paddingHorizontal: 18,
    paddingVertical: 8,
    alignItems: "center",
    marginHorizontal: 6,
    width: 190,
  },
  detailLabel: {
    fontSize: 7,
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  qrBlock: {
    flexDirection: "row",
    alignItems: "center",
  },
  qrImage: {
    width: 62,
    height: 62,
    marginRight: 8,
  },
  qrText: {
    fontSize: 7,
    color: "#64748b",
    width: 140,
    lineHeight: 1.4,
  },
  signatureBlock: {
    alignItems: "center",
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#0f172a",
    width: 190,
    marginBottom: 5,
  },
  signatureName: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  signatureRole: {
    fontSize: 7,
    color: "#64748b",
    marginTop: 2,
  },
});

const CertificatePage = ({ data }: { data: CertificatePdfData }) => {
  const teacher = data.teacherName?.trim() ? data.teacherName : null;
  const language = data.language && data.language !== "English" ? ` (${data.language})` : "";

  return (
    <Page size={[pageWidth, pageHeight]} style={styles.page}>
      <View style={styles.frame}>
        <View style={styles.innerFrame}>
          <View style={styles.header}>
            <View style={styles.orgMark}>
              <Text style={styles.orgMarkText}>MH-SKILL</Text>
            </View>
            <View>
              <Text style={styles.orgName}>MH-SKILL</Text>
              <Text style={styles.orgTag}>Skill Development &amp; Vocational Training Program</Text>
            </View>
            <Text style={styles.certNumber}>Certificate No.{`\n`}{data.certificateNumber}</Text>
          </View>

          <Text style={styles.certTitle}>CERTIFICATE OF ACHIEVEMENT</Text>
          <Text style={styles.certSubtitle}>THIS IS TO CERTIFY THAT</Text>
          <View style={styles.divider} />

          <Text style={styles.name}>{data.fullName}</Text>
          <Text style={styles.completed}>
            has successfully completed the training program{language}
          </Text>
          <Text style={styles.course}>{data.courseTitle}</Text>

          <View style={styles.detailsRow}>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>COMPLETION DATE</Text>
              <Text style={styles.detailValue}>{formatDate(data.completionDate)}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>BATCH</Text>
              <Text style={styles.detailValue}>{data.batch?.trim() ? data.batch : NOT_PROVIDED}</Text>
            </View>
            <View style={styles.detailBox}>
              <Text style={styles.detailLabel}>ISSUE DATE</Text>
              <Text style={styles.detailValue}>{formatDate(data.issueDate)}</Text>
            </View>
          </View>

            <View style={styles.footer}>
            <View style={styles.qrBlock}>
              {data.qrDataUrl ? (
                <Image style={styles.qrImage} src={data.qrDataUrl} aria-label="Certificate verification QR code" />
              ) : null}
              <Text style={styles.qrText}>
                Scan to verify this certificate online at {data.verificationUrl ?? "the official verification portal"}
              </Text>
            </View>
            <View style={styles.signatureBlock}>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureName}>{teacher ?? "Program Coordinator"}</Text>
              <Text style={styles.signatureRole}>{teacher ? "Trainer" : "MH-SKILL"}</Text>
            </View>
          </View>
        </View>
      </View>
    </Page>
  );
};

async function buildCertificatePdfFromReactPdf(certs: CertificatePdfData[]): Promise<Blob> {
  const withQr = await Promise.all(
    certs.map(async (data) => {
      if (data.verificationUrl && !data.qrDataUrl) {
        try {
          return { ...data, qrDataUrl: await buildCertificateQrDataUrl(data.verificationUrl) };
        } catch {
          return data;
        }
      }
      return data;
    }),
  );

  const doc = (
    <Document>
      {withQr.map((data, i) => (
        <CertificatePage key={data.certificateNumber ?? i} data={data} />
      ))}
    </Document>
  );
  return pdf(doc).toBlob();
}

/**
 * Build a single PDF blob from the user's HTML certificate template.
 * Falls back to the @react-pdf design if the template/Chrome is unavailable.
 */
export async function buildCertificatePdfBlob(certs: CertificatePdfData[]): Promise<Blob> {
  try {
    const { PDFDocument } = await import("pdf-lib");
    const buffers = await renderCertificatePdfBuffers(certs);

    const merged = await PDFDocument.create();
    for (const buffer of buffers) {
      const doc = await PDFDocument.load(buffer);
      const pages = await merged.copyPages(doc, doc.getPageIndices());
      for (const page of pages) merged.addPage(page);
    }

    const bytes = await merged.save();
    return new Blob([bytes as BlobPart], { type: "application/pdf" });
  } catch (error) {
    console.warn("[certificate-pdf] HTML template rendering failed; falling back to @react-pdf.", error);
    return buildCertificatePdfFromReactPdf(certs);
  }
}

/**
 * Render each certificate to a separate PDF buffer (one browser instance).
 * Used by bulk ZIP downloads. Falls back to @react-pdf per certificate.
 */
export async function buildCertificatePdfBuffers(certs: CertificatePdfData[]): Promise<Buffer[]> {
  try {
    return await renderCertificatePdfBuffers(certs);
  } catch (error) {
    console.warn("[certificate-pdf] HTML template rendering failed; falling back to @react-pdf.", error);
    const buffers: Buffer[] = [];
    for (const cert of certs) {
      const blob = await buildCertificatePdfFromReactPdf([cert]);
      buffers.push(Buffer.from(await blob.arrayBuffer()));
    }
    return buffers;
  }
}

export async function buildCertificateQrDataUrl(verificationUrl: string): Promise<string> {
  return QRCode.toDataURL(verificationUrl, {
    width: 256,
    margin: 1,
    color: { dark: "#0f172a", light: "#ffffff" },
  });
}
