"use client";

/**
 * Vendored from the official Vengeance UI registry:
 *   corepack pnpm exec shadcn add @vengeanceui/perspective-grid
 *
 * Local changes:
 *  1. Removed mount-only state; the deterministic grid is safe on the server.
 *  2. Replaced white/black and gray hardcoding with Dough Lab tokens.
 *  3. Tightened perspective, density, borders, and fade masks.
 *  4. Added sparse deterministic acid-lime active geometry.
 */

import { cn } from "@/lib/utils";

interface PerspectiveGridProps {
  className?: string;
  gridSize?: number;
  showOverlay?: boolean;
  fadeRadius?: number;
}

export function PerspectiveGrid({
  className,
  gridSize = 22,
  showOverlay = true,
  fadeRadius = 78,
}: PerspectiveGridProps) {
  const tiles = Array.from({ length: gridSize * gridSize });

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative h-full w-full overflow-hidden bg-transparent",
        className
      )}
      style={{ perspective: "1400px", transformStyle: "preserve-3d" }}
    >
      <div
        className="absolute top-[54%] left-1/2 grid aspect-square w-[64rem] origin-center"
        style={{
          transform:
            "translate(-50%, -50%) rotateX(56deg) rotateZ(-16deg) scale(1.35)",
          transformStyle: "preserve-3d",
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gridTemplateRows: `repeat(${gridSize}, 1fr)`,
        }}
      >
        {tiles.map((_, index) => {
          const column = index % gridSize;
          const row = Math.floor(index / gridSize);
          const isActive =
            (column === Math.floor(gridSize * 0.56) && row > gridSize * 0.28) ||
            (row === Math.floor(gridSize * 0.68) && column < gridSize * 0.58);

          return (
            <div
              key={index}
              className={cn(
                "min-h-px min-w-px border-[0.5px] border-graphite/55 bg-transparent",
                isActive && "border-acid-lime/30"
              )}
            />
          );
        })}
      </div>

      {showOverlay ? (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          style={{
            background: `radial-gradient(ellipse at 50% 52%, transparent 22%, var(--stage) ${fadeRadius}%)`,
          }}
        />
      ) : null}
    </div>
  );
}

export default PerspectiveGrid;
