import { ImageResponse } from "next/og";

import { siteConfig } from "@/config/site";

export const alt = `${siteConfig.name} by ${siteConfig.brand}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Social card.
 *
 * Colours are inlined rather than taken from the design tokens because this
 * renders through Satori, which has no access to the stylesheet or CSS
 * variables. They mirror the dark surface palette in globals.css.
 */
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        backgroundColor: "#08090a",
        backgroundImage:
          "radial-gradient(circle at 78% 12%, #23252a 0%, transparent 55%)",
        padding: "72px 80px",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#e4f222",
          }}
        >
          {siteConfig.brand}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: 92,
            lineHeight: 1.05,
            color: "#ffffff",
            letterSpacing: -2,
          }}
        >
          {siteConfig.name}
        </div>
        <div
          style={{
            fontSize: 32,
            color: "#8a8f98",
            maxWidth: 820,
            lineHeight: 1.35,
          }}
        >
          Scale dough by baking area, in baker&rsquo;s percentages.
        </div>
      </div>

      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div style={{ height: 4, width: 96, backgroundColor: "#e4f222" }} />
        <div style={{ fontSize: 24, color: "#8a8f98" }}>
          Steel · Stone · Sheet pan
        </div>
      </div>
    </div>,
    { ...size }
  );
}
