import { ImageResponse } from "next/og";

export const alt = "Yulaverse Studio — Design a universe your brand can own.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        background: "#0B0D12",
        color: "#F4F0E8",
        padding: "68px 76px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", fontSize: 24, fontWeight: 700 }}>
          Yulaverse Studio
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 16,
            letterSpacing: "0.18em",
            color: "#C6A66B",
          }}
        >
          CREATIVE STUDIO / 2026
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            maxWidth: 980,
            fontSize: 82,
            lineHeight: 0.98,
            fontWeight: 800,
            letterSpacing: "-0.055em",
          }}
        >
          Design a universe your brand can own.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 36,
            fontSize: 21,
            color: "rgba(244,240,232,.65)",
          }}
        >
          Distinctive identities and premium websites for ambitious brands.
        </div>
      </div>
    </div>,
    size,
  );
}
