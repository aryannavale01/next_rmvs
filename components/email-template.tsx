import type { CSSProperties } from "react";

interface EmailTemplateProps {
  firstName: string;
  code: string;
  siteName: string;
  expiresInMinutes: number;
  brandColor?: string;
}

const pageStyle: CSSProperties = {
  margin: 0,
  padding: 0,
  backgroundColor: "#f3f4f6",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
};

const cardStyle: CSSProperties = {
  width: "100%",
  maxWidth: 600,
  margin: "0 auto",
  backgroundColor: "#ffffff",
  borderRadius: 16,
  overflow: "hidden",
  boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
};

export function EmailTemplate({
  firstName,
  code,
  siteName,
  expiresInMinutes,
  brandColor = "#2563EB",
}: EmailTemplateProps) {
  const greeting = firstName.trim() ? firstName.trim() : "there";

  return (
    <div style={pageStyle}>
      <div style={{ padding: 32 }}>
        <div style={cardStyle}>
          <div style={{ backgroundColor: brandColor, padding: "28px 24px", textAlign: "center" }}>
            <span style={{ color: "#ffffff", fontSize: 22, fontWeight: 700, letterSpacing: 0.5 }}>
              {siteName}
            </span>
          </div>

          <div style={{ padding: "36px 32px 28px 32px", backgroundColor: "#ffffff" }}>
            <h1 style={{ margin: "0 0 12px 0", color: "#111827", fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>
              Your one-time login code
            </h1>
            <p style={{ margin: "0 0 20px 0", color: "#4b5563", fontSize: 15, lineHeight: 1.6 }}>
              Hi {greeting}, use the code below to finish signing in to your {siteName} admin account. This code expires in <strong>{expiresInMinutes} minutes</strong>.
            </p>

            <div style={{ margin: "0 0 24px 0", textAlign: "center", backgroundColor: "#f0fdf9", border: "1px solid #d1fae5", borderRadius: 12, padding: "22px 16px" }}>
              <span style={{ fontFamily: "'SF Mono', SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace", fontSize: 36, fontWeight: 700, letterSpacing: 10, color: "#0f766e" }}>
                {code}
              </span>
            </div>

            <p style={{ margin: 0, color: "#6b7280", fontSize: 13, lineHeight: 1.6 }}>
              If you didn't request this code, you can ignore this email — your account is still secure.
            </p>
          </div>

          <div style={{ padding: "24px 32px 32px 32px", backgroundColor: "#fafafa", borderTop: "1px solid #eef0f2", textAlign: "center" }}>
            <p style={{ margin: "0 0 8px 0", color: "#9ca3af", fontSize: 13, lineHeight: 1.6 }}>
              You are receiving this email because you are associated with {siteName}.
            </p>
            <p style={{ margin: 0, color: "#9ca3af", fontSize: 12, lineHeight: 1.6 }}>
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}