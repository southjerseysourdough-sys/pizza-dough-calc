import type { BakingSurface } from "./dough";

/**
 * Equipment metadata.
 *
 * Equipment dimensions describe the hardware only. They never feed the dough
 * formula: selecting a surface must not silently change hydration, salt,
 * yeast, fat, or dough weight. They are used for fit guidance alone.
 */

export type SteelProfile = {
  readonly id: BakingSurface;
  readonly name: string;
  /** Longest edge, in inches. */
  readonly widthInches: number;
  /** Shortest edge, in inches. This is what limits round pizza diameter. */
  readonly depthInches: number;
  readonly thicknessInches: number;
  readonly weightPounds: number;
  /** Where the published figures above came from. */
  readonly sourceUrl?: string;
  readonly description: string;
};

export type PanProfile = {
  readonly id: string;
  readonly name: string;
  /** Nominal outer size as sold, in inches. */
  readonly nominalLengthInches: number;
  readonly nominalWidthInches: number;
  /**
   * Flat inside baking surface, in inches.
   *
   * Interior dimensions vary between manufacturers, so these default to the
   * nominal size and are flagged unmeasured until the baker enters their own.
   * See `isInteriorMeasured`.
   */
  readonly usableInteriorLengthInches: number;
  readonly usableInteriorWidthInches: number;
  /**
   * False when the interior values above are merely copied from the nominal
   * size. The UI must prompt the baker to measure in that case.
   */
  readonly isInteriorMeasured: boolean;
  readonly isRimmed: boolean;
};
