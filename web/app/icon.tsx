import { ImageResponse } from "next/og";

// Convention Next.js 15 : génère dynamiquement /favicon.ico à partir de ce composant
export const runtime = "edge";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #E91E8C 0%, #8B5CF6 50%, #FF8533 100%)",
          borderRadius: 14,
          color: "white",
          fontSize: 44,
          fontWeight: 900,
          fontFamily: "system-ui, sans-serif",
          letterSpacing: "-0.05em",
        }}
      >
        N
      </div>
    ),
    { ...size },
  );
}
