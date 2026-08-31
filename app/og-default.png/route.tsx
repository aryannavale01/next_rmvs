import { ImageResponse } from "next/og";
import { getOrgConfig } from "@/lib/org-config";

export const dynamic = "force-dynamic";

export async function GET() {
  let siteName = "CompassionGlobal NGO Portal";
  try {
    const config = await getOrgConfig();
    if (config.siteName) siteName = config.siteName;
  } catch {
    // Fall back to the default name if config can't be resolved.
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0f172a",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            fontSize: "56px",
            fontWeight: 800,
          }}
        >
          <span
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              background: "#2563EB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
            }}
          >
            CG
          </span>
          {siteName}
        </div>
        <div style={{ marginTop: "24px", fontSize: "26px", color: "#94a3b8" }}>
          Empowering communities through skill development.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
