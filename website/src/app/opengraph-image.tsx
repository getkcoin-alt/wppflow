import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "Scriwo — the shared WhatsApp inbox for teams in the UAE and India";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const read = async (f: string) => `data:image/${f.endsWith(".png") ? "png" : "jpeg"};base64,${(await readFile(join(process.cwd(), "public/brand", f))).toString("base64")}`;
  const [mark, riwo] = await Promise.all([read("scriwo-mark-512.png"), read("riwo-og.jpg")]);
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "radial-gradient(70% 90% at 90% 10%, #f3e7cc 0%, #fbfaf7 55%)", color: "#1e2227", fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, width: 760 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse */}
            <img src={mark} width={72} height={72} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1 }}>Scriwo</div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 3, color: "#4e5258" }}>SHARED WHATSAPP INBOX</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 64, lineHeight: 1.06, fontWeight: 700 }}>Every WhatsApp chat your team has, in one calm place.</div>
            <div style={{ marginTop: 24, fontSize: 28, color: "#96702c" }}>WhatsApp CRM · UAE and India · with Riwo, the AI assistant</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 440 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by ImageResponse */}
          <img src={riwo} width={380} height={380} alt="" style={{ borderRadius: 40 }} />
        </div>
      </div>
    ),
    size,
  );
}
