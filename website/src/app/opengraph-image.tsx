import { ImageResponse } from "next/og";

export const alt = "Scriwo — the shared WhatsApp inbox for teams in the UAE and India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "radial-gradient(60% 80% at 90% 0%, #3b3220 0%, #0a0b0c 60%)", color: "white", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 28, letterSpacing: 10 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "#16191b", border: "1px solid #2a2f33", display: "flex", alignItems: "center", justifyContent: "center", color: "#d6b97b", fontSize: 34 }}>W</div>
          SCRIWO
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, lineHeight: 1.05, fontWeight: 600, maxWidth: 950 }}>Every WhatsApp chat your team has, in one calm place.</div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#d6b97b" }}>Shared WhatsApp inbox & CRM · UAE and India</div>
        </div>
      </div>
    ),
    size,
  );
}
