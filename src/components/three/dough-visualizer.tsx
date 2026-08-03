"use client";

import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import type { DoughVisualState } from "./dough-visualizer-scene";

/**
 * The live dough visualization.
 *
 * WebGL is an enhancement layered over a CSS form that always renders. If the
 * canvas never mounts — no WebGL, reduced hardware, a device that would
 * struggle — the fallback below still shows the dough's shape and proportion,
 * and every number on the page is unaffected.
 */

// Never server rendered: it touches WebGL on mount.
const DoughVisualizerScene = dynamic(() => import("./dough-visualizer-scene"), {
  ssr: false,
});

export type { DoughVisualState };

/**
 * Cached WebGL capability probe. Module level so at most one probe context is
 * ever created, and so it is cheap enough to call during render.
 */
let webGlSupport: boolean | null = null;

function supportsWebGl(): boolean {
  if (webGlSupport !== null) return webGlSupport;
  if (typeof window === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    context?.getExtension("WEBGL_lose_context")?.loseContext();
    webGlSupport = context !== null;
  } catch {
    webGlSupport = false;
  }

  return webGlSupport;
}

/**
 * CSS-only dough form.
 *
 * Always rendered, and the sole visual when WebGL is unavailable. It responds
 * to the same shape and hydration inputs, so the fallback is a real
 * representation rather than an empty box.
 */
function DoughFallback({ state }: { state: DoughVisualState }) {
  const isRound = state.shape === "round";
  // Wetter dough slumps wider and lower, matching the WebGL behaviour.
  const hydrationT = Math.min(Math.max((state.hydration - 0.5) / 0.45, 0), 1);
  const flatten = 1 - hydrationT * 0.28;

  return (
    <div
      aria-hidden="true"
      // Decorative, so it has no accessible name to query by; this attribute
      // is how tests assert the fallback is present without WebGL.
      data-dough-fallback={state.shape}
      className="absolute inset-0 flex items-center justify-center"
    >
      <div
        className={cn(
          "transition-all duration-500 ease-out",
          isRound ? "rounded-full" : "rounded-[14%]"
        )}
        style={{
          // Sized from the container's height rather than its width, so the
          // form always fits the stage however wide the column becomes.
          height: isRound ? "74%" : "52%",
          aspectRatio: isRound ? "1 / 1" : `${state.panAspectRatio} / 1`,
          maxWidth: "80%",
          transform: `scaleY(${flatten})`,
          background:
            "radial-gradient(60% 55% at 38% 28%, color-mix(in oklch, var(--flour) 92%, white) 0%, color-mix(in oklch, var(--flour) 78%, var(--crust)) 62%, color-mix(in oklch, var(--crust) 42%, var(--flour)) 100%)",
          boxShadow:
            "0 18px 40px -18px color-mix(in oklch, var(--crust) 60%, transparent), inset 0 2px 10px color-mix(in oklch, white 40%, transparent)",
        }}
      />
    </div>
  );
}

export function DoughVisualizer({
  state,
  className,
}: {
  state: DoughVisualState;
  className?: string;
}) {
  const prefersReducedMotion = useReducedMotion();
  // The canvas only ever mounts on the client, so reading the resolved theme
  // here cannot cause a hydration mismatch.
  const { resolvedTheme } = useTheme();

  // Returns false on the server and during hydration, so the probe below only
  // ever runs in the browser. Narrow screens are the most likely to be battery
  // constrained, so the canvas is skipped there and the CSS form stands alone.
  const isWideViewport = useMediaQuery("(min-width: 640px)");
  const canRenderWebGl = isWideViewport && supportsWebGl();

  return (
    <div className={cn("relative", className)}>
      {canRenderWebGl ? (
        <div className="absolute inset-0">
          {/* Continuous settling motion is dropped under reduced motion; the
              form still reshapes when the numbers change, it simply does not
              breathe on its own. */}
          <DoughVisualizerScene
            state={state}
            animate={!prefersReducedMotion}
            isDark={resolvedTheme === "dark"}
          />
        </div>
      ) : (
        /*
         * The CSS form replaces the canvas rather than sitting behind it.
         * Layering the two showed both at once through the transparent canvas,
         * and the silhouettes never matched — the fallback is a stand-in, not
         * an underlay.
         */
        <DoughFallback state={state} />
      )}
    </div>
  );
}
