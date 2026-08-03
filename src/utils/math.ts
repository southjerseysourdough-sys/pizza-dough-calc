/** Generic numeric helpers. No domain logic. */

/** Constrains a value to the inclusive `[min, max]` range. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Rounds to a fixed number of decimal places without float drift. */
export function roundTo(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

/** Linearly interpolates between `a` and `b`. `t` is clamped to `[0, 1]`. */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}
