import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Unicon by WebRenew — Icon Library for React";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
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
          backgroundColor: "#080808",
          backgroundImage:
            "radial-gradient(circle at 25% 25%, #1a1a1a 0%, transparent 50%), radial-gradient(circle at 75% 75%, #1a1a1a 0%, transparent 50%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <span style={{ fontSize: 80 }}>🦄</span>
          <span
            style={{
              fontSize: 72,
              fontWeight: 200,
              color: "white",
              letterSpacing: "-0.02em",
            }}
          >
            UNICON
          </span>
        </div>
        <div
          style={{
            fontSize: 40,
            color: "rgba(255, 255, 255, 0.9)",
            textAlign: "center",
            maxWidth: 900,
            lineHeight: 1.3,
            fontWeight: 300,
          }}
        >
          Just the icons you need. Zero bloat.
        </div>
        <div
          style={{
            fontSize: 24,
            color: "rgba(255, 255, 255, 0.5)",
            marginTop: 24,
            textAlign: "center",
          }}
        >
          10,000+ icons from Lucide, Phosphor & Huge Icons
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            display: "flex",
            alignItems: "center",
            gap: 8,
            color: "rgba(255, 255, 255, 0.4)",
            fontSize: 20,
          }}
        >
          by WebRenew
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
