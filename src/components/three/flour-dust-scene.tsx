"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Points as ThreePoints } from "three";

/**
 * Decorative flour dust.
 *
 * Purely atmospheric: it encodes no recipe value and carries no meaning, so it
 * is hidden from assistive technology and never blocks pointer events. The
 * calculator is fully usable when this never mounts.
 *
 * This is an abstract drift of particles, not a simulation of anything, and
 * makes no claim to model flour, air or dough behaviour.
 */

const PARTICLE_COUNT = 420;
/** Capped rather than using the device ratio, which is costly on dense phones. */
const MAX_PIXEL_RATIO = 1.5;

function generateParticles(count: number): Float32Array {
  const positions = new Float32Array(count * 3);
  for (let index = 0; index < count; index += 1) {
    positions[index * 3] = (Math.random() - 0.5) * 12;
    positions[index * 3 + 1] = (Math.random() - 0.5) * 7;
    positions[index * 3 + 2] = (Math.random() - 0.5) * 5;
  }
  return positions;
}

function DriftingParticles() {
  const pointsRef = useRef<ThreePoints>(null);
  const positions = useMemo(() => generateParticles(PARTICLE_COUNT), []);

  useFrame((_state, delta) => {
    if (!pointsRef.current) return;
    // A slow yaw is enough to suggest suspended dust without drawing the eye.
    pointsRef.current.rotation.y += delta * 0.014;
  });

  return (
    <Points ref={pointsRef} positions={positions} frustumCulled={false}>
      <PointMaterial
        transparent
        // Warm off-white, matching the flour tones in the palette.
        color="#d8c9ad"
        size={0.032}
        sizeAttenuation
        depthWrite={false}
        opacity={0.55}
      />
    </Points>
  );
}

export default function FlourDustScene() {
  const prefersReducedMotion = useReducedMotion();
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);

  useEffect(() => {
    const handleVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    handleVisibility();
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  // Nothing renders at all under reduced motion: no WebGL context is created
  // and no render loop starts. The CSS fallback behind it remains visible.
  if (prefersReducedMotion) return null;

  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0, 6], fov: 50 }}
      dpr={[1, MAX_PIXEL_RATIO]}
      // Transparent so the CSS gradient underneath shows through, and cheap:
      // no antialiasing for soft round points that do not show jagged edges.
      gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
      // Renders only when invalidated, and the loop below stops entirely
      // while the tab is hidden.
      frameloop={isDocumentVisible ? "always" : "never"}
      style={{ pointerEvents: "none" }}
    >
      <DriftingParticles />
    </Canvas>
  );
}
