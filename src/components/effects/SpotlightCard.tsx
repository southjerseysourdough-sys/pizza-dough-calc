"use client";

import React, { useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Vendored from the React Bits registry:
 *   pnpm dlx shadcn@latest add @react-bits/SpotlightCard-TS-TW \
 *     --path src/components/effects
 *
 * Local changes from the upstream source, all recorded in
 * docs/component-inventory.md:
 *  1. Added the "use client" directive, which the registry source omits
 *     despite using hooks.
 *  2. Replaced the hardcoded `border-neutral-800 bg-neutral-900` shell with
 *     design tokens, so it works in light and dark rather than dark only.
 *  3. Merged classes with `cn` rather than string concatenation, so callers
 *     can genuinely override padding and radius.
 *  4. Widened `spotlightColor` from an rgba template literal type to string,
 *     so a token-driven colour can be passed.
 *  5. Added `disabled`, used by the format controls under reduced motion.
 *
 * The spotlight follows the pointer and never animates on its own, so it is
 * inert for keyboard users; under reduced motion the global transition
 * override in globals.css removes the fade.
 */

interface Position {
  x: number;
  y: number;
}

interface SpotlightCardProps extends React.PropsWithChildren {
  className?: string;
  /** Any CSS colour. Defaults to the project signal accent. */
  spotlightColor?: string;
  disabled?: boolean;
}

export default function SpotlightCard({
  children,
  className,
  spotlightColor = "color-mix(in oklch, var(--acid-lime) 14%, transparent)",
  disabled = false,
}: SpotlightCardProps) {
  const divRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState<number>(0);

  const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (disabled || !divRef.current || isFocused) return;

    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleFocus = () => {
    if (disabled) return;
    setIsFocused(true);
    setOpacity(0.6);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setOpacity(0);
  };

  const handleMouseEnter = () => {
    if (disabled) return;
    setOpacity(0.6);
  };

  const handleMouseLeave = () => {
    setOpacity(0);
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        "relative overflow-hidden rounded-xl border-[0.5px] border-graphite bg-card",
        className
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 ease-in-out"
        style={{
          opacity: disabled ? 0 : opacity,
          background: `radial-gradient(circle at ${position.x}px ${position.y}px, ${spotlightColor}, transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}
