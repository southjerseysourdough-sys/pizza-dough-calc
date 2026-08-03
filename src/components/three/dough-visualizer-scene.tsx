"use client";

import { ContactShadows, Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import type { Group, Mesh, MeshStandardMaterial } from "three";

/**
 * The live dough form.
 *
 * An abstract, illustrative representation of the dough the calculator has
 * just worked out — not a simulation. It makes no claim to model gluten,
 * fermentation or rheology; it exists so a change in the numbers has a
 * physical consequence you can see.
 *
 * How the inputs map onto the form:
 *  - shape          round ball  <->  rectangular slab, morphed between
 *  - dough weight   overall scale
 *  - hydration      flattening, surface roughness and edge softness
 *  - aspect ratio   slab proportions in pan mode
 *  - quantity       number of forms shown, capped for legibility
 */

export type DoughVisualState = {
  shape: "round" | "rectangular";
  /** Grams for a single pizza or pan. */
  doughWeightPerUnitGrams: number;
  /** Decimal, e.g. 0.63. */
  hydration: number;
  /** Round mode only. */
  diameterInches: number;
  /** Rectangular mode: interior length / width. */
  panAspectRatio: number;
  quantity: number;
};

/** More forms than this becomes clutter rather than information. */
const MAX_VISIBLE_FORMS = 3;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Eases a value into 0..1 across a range, for mapping inputs onto the form. */
function normalize(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

function DoughForm({
  state,
  index,
  animate,
}: {
  state: DoughVisualState;
  index: number;
  animate: boolean;
}) {
  const groupRef = useRef<Group>(null);
  const meshRef = useRef<Mesh>(null);

  // Current values, eased toward the target every frame so a change in the
  // calculator settles rather than snapping.
  const current = useRef({ morph: 0, flatten: 1, scale: 1 });

  useFrame((frameState, delta) => {
    const group = groupRef.current;
    const mesh = meshRef.current;
    if (!group || !mesh) return;

    const hydrationT = normalize(state.hydration, 0.5, 0.95);

    // Wetter dough slumps: it spreads wider and sits lower.
    const targetFlatten = 1 - hydrationT * 0.42;
    // Weight drives overall size, on a cube root so doubling the dough does
    // not double the silhouette.
    const targetScale =
      0.86 * Math.cbrt(clamp(state.doughWeightPerUnitGrams, 80, 2400) / 560);
    const targetMorph = state.shape === "rectangular" ? 1 : 0;

    // Critically damped easing. Frame-rate independent.
    const ease = 1 - Math.exp(-delta * 6);
    current.current.morph += (targetMorph - current.current.morph) * ease;
    current.current.flatten += (targetFlatten - current.current.flatten) * ease;
    current.current.scale += (targetScale - current.current.scale) * ease;

    const { morph, flatten, scale } = current.current;

    // Round mode widens with diameter; pan mode stretches to the pan's ratio.
    const roundWidth = 1 + normalize(state.diameterInches, 8, 20) * 0.35;
    const panRatio = clamp(state.panAspectRatio, 0.6, 2.4);

    const widthX = roundWidth * (1 - morph) + panRatio * 1.15 * morph;
    const depthZ = roundWidth * (1 - morph) + 1.0 * morph;

    group.scale.set(
      scale * widthX,
      scale * flatten * (1 - morph * 0.35),
      scale * depthZ
    );

    if (animate) {
      // A slow settle, like dough relaxing after shaping. Offset per form so
      // multiple balls do not pulse in lockstep.
      const t = frameState.clock.elapsedTime + index * 1.7;
      group.position.y = Math.sin(t * 0.45) * 0.012;
      group.rotation.y = Math.sin(t * 0.18) * 0.06 + morph * 0.0;
    } else {
      group.position.y = 0;
      group.rotation.y = 0;
    }

    // Hydration also reads on the surface: wetter dough is glossier and
    // smoother, drier dough is matte and floury.
    const material = mesh.material as MeshStandardMaterial;
    material.roughness = 0.92 - hydrationT * 0.3;
  });

  // Rounded box doubles as both forms: high radius reads as a ball, low
  // radius as a slab. Morphing the radius is what ties the two modes together.
  const morphedRadius = state.shape === "rectangular" ? 0.22 : 0.5;

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 48, 32]} />
        <meshStandardMaterial
          color="#e8d9bd"
          roughness={0.85}
          metalness={0.02}
          flatShading={false}
        />
      </mesh>
      {/* A second, slightly larger shell gives the edge a soft floury halo
          instead of a hard silhouette. */}
      <mesh scale={1.02}>
        <sphereGeometry args={[1, 32, 24]} />
        <meshStandardMaterial
          color="#f2e7d2"
          transparent
          opacity={0.18 * (1 - morphedRadius)}
          roughness={1}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Scene({
  state,
  animate,
  isDark,
}: {
  state: DoughVisualState;
  animate: boolean;
  isDark: boolean;
}) {
  const visible = Math.min(
    Math.max(Math.round(state.quantity) || 1, 1),
    MAX_VISIBLE_FORMS
  );

  // On a dark stage the same exposure blows the dough out into a glowing
  // orb, so the key light and ambient fill are pulled back and the cool
  // bounce is lifted to keep the form readable against carbon.
  const keyIntensity = isDark ? 1.5 : 2.4;
  const ambientIntensity = isDark ? 0.18 : 0.5;
  const fillIntensity = isDark ? 0.4 : 0.55;
  const envIntensity = isDark ? 0.16 : 0.32;

  // Lay the forms out along X, centred.
  const spacing = state.shape === "rectangular" ? 1.9 : 1.5;
  const offset = ((visible - 1) * spacing) / 2;

  return (
    <>
      {/* Warm oven light from the upper right. */}
      <directionalLight
        position={[3.2, 4.5, 2.2]}
        intensity={keyIntensity}
        color="#ffb163"
        castShadow
        shadow-mapSize={[512, 512]}
      />
      {/* Cool steel bounce from the lower left. */}
      <directionalLight
        position={[-3.5, -0.8, -1.5]}
        intensity={fillIntensity}
        color="#8fb4d8"
      />
      <ambientLight intensity={ambientIntensity} color="#f0e2c8" />

      {Array.from({ length: visible }, (_, index) => (
        <group key={index} position={[index * spacing - offset, 0, 0]}>
          <DoughForm state={state} index={index} animate={animate} />
        </group>
      ))}

      <ContactShadows
        position={[0, -0.78, 0]}
        opacity={isDark ? 0.5 : 0.3}
        scale={9}
        blur={2.6}
        far={2.2}
        resolution={256}
        color="#2a1c0e"
      />
      {/* Cheap studio reflection; no HDR file is fetched. */}
      <Environment preset="apartment" environmentIntensity={envIntensity} />
    </>
  );
}

export default function DoughVisualizerScene({
  state,
  animate,
  isDark,
}: {
  state: DoughVisualState;
  animate: boolean;
  isDark: boolean;
}) {
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

  // With motion allowed the loop runs continuously; otherwise frames are
  // rendered only when React re-renders the scene, so a settled form costs
  // nothing. Either way the loop halts while the tab is hidden.
  const frameloop = !isDocumentVisible
    ? "never"
    : animate
      ? "always"
      : "demand";

  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.95, 5.3], fov: 34 }}
      dpr={[1, 1.5]}
      shadows="percentage"
      gl={{ alpha: true, antialias: true, powerPreference: "low-power" }}
      frameloop={frameloop}
      style={{ pointerEvents: "none" }}
    >
      <Scene state={state} animate={animate} isDark={isDark} />
    </Canvas>
  );
}
