export const PIZZA_FRAME_COUNT = 30;
export const PIZZA_FRAME_COLUMNS = 6;
export const PIZZA_FRAME_ROWS = 5;

export function clampPizzaFrame(frame: number): number {
  return Math.min(PIZZA_FRAME_COUNT - 1, Math.max(0, Math.round(frame)));
}

export function pizzaFramePosition(frame: number): {
  frame: number;
  xPercent: number;
  yPercent: number;
} {
  const safeFrame = clampPizzaFrame(frame);
  const column = safeFrame % PIZZA_FRAME_COLUMNS;
  const row = Math.floor(safeFrame / PIZZA_FRAME_COLUMNS);
  return {
    frame: safeFrame,
    xPercent: (column / (PIZZA_FRAME_COLUMNS - 1)) * 100,
    yPercent: (row / (PIZZA_FRAME_ROWS - 1)) * 100,
  };
}

export function interpolatePizzaFrame(
  start: number,
  target: number,
  progress: number
): number {
  const safeProgress = Math.min(1, Math.max(0, progress));
  const eased =
    safeProgress < 0.5
      ? 4 * safeProgress ** 3
      : 1 - Math.pow(-2 * safeProgress + 2, 3) / 2;
  return clampPizzaFrame(start + (target - start) * eased);
}
