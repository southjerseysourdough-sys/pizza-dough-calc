"use client";

import dynamic from "next/dynamic";

import { useMediaQuery } from "@/hooks/use-media-query";

/**
 * Optional atmospheric layer behind the calculator header.
 *
 * The CSS gradient is the real background and always renders. WebGL is layered
 * on top only when the browser supports it and the viewport is wide enough to
 * be worth the cost, so this is an enhancement and never a dependency. Reduced
 * motion is handled inside the scene, which declines to mount at all.
 */

// Never server rendered: it touches WebGL and window on mount.
const FlourDustScene = dynamic(() => import("./flour-dust-scene"), {
  ssr: false,
});

/**
 * Cached WebGL capability probe.
 *
 * Module-level so the context is created at most once per page load, and so
 * this stays cheap enough to call during render.
 */
let webGlSupport: boolean | null = null;

function supportsWebGl(): boolean {
  if (webGlSupport !== null) return webGlSupport;
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    // Release the probe context immediately; browsers cap how many exist.
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    webGlSupport = context !== null;
  } catch {
    webGlSupport = false;
  }

  return webGlSupport;
}

export function Atmosphere() {
  // Returns false on the server and during hydration, so the probe below only
  // ever runs in the browser.
  const isWideViewport = useMediaQuery("(min-width: 768px)");
  const canRenderWebGl = isWideViewport && supportsWebGl();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {/* CSS fallback: always present, and the only layer when WebGL is off. */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_-10%,var(--accent),transparent_60%)] opacity-70" />
      {canRenderWebGl ? <FlourDustScene /> : null}
    </div>
  );
}
