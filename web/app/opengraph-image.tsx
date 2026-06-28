import { ImageResponse } from "next/og";

// Convention Next.js : génère /opengraph-image pour partages Facebook/Twitter/LinkedIn
export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "Nakoa — Imprimer commence ici";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #1a0b2e 0%, #2d0a4e 50%, #11050a 100%)",
          padding: 80,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* Halo lumineux orange */}
        <div
          style={{
            position: "absolute",
            top: -200,
            right: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(255,133,51,0.4) 0%, transparent 70%)",
          }}
        />
        {/* Halo lumineux rose */}
        <div
          style={{
            position: "absolute",
            bottom: -200,
            left: -200,
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(233,30,140,0.4) 0%, transparent 70%)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 32,
            marginBottom: 60,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 120,
              height: 120,
              borderRadius: 28,
              background: "linear-gradient(135deg, #E91E8C 0%, #8B5CF6 50%, #FF8533 100%)",
              color: "white",
              fontSize: 88,
              fontWeight: 900,
              letterSpacing: "-0.08em",
            }}
          >
            N
          </div>
          <div style={{ display: "flex", flexDirection: "column", color: "white" }}>
            <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.04em" }}>
              Nakoa
            </div>
            <div style={{ fontSize: 24, marginTop: 8, color: "rgba(255,255,255,0.7)" }}>
              Imprimer commence ici.
            </div>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: 44,
            fontWeight: 700,
            color: "white",
            textAlign: "center",
            lineHeight: 1.2,
            zIndex: 10,
            maxWidth: 900,
          }}
        >
          Imprimez. Livrez. <span style={{ color: "#FF8533" }}>Brillez.</span>
        </div>
        <div
          style={{
            fontSize: 22,
            color: "rgba(255,255,255,0.65)",
            marginTop: 24,
            textAlign: "center",
            zIndex: 10,
          }}
        >
          La plateforme d&apos;impression intelligente pour l&apos;Afrique de l&apos;Ouest
        </div>
      </div>
    ),
    { ...size },
  );
}
