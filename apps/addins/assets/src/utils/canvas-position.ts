const MIN_VISIBLE_FRACTION = 0.1;

export function clampCanvasPosition(
  x: number,
  y: number,
  width: number,
  height: number = width,
): { x: number; y: number } {
  const minX = -width + MIN_VISIBLE_FRACTION;
  const maxX = 1 - MIN_VISIBLE_FRACTION;
  const minY = -height + MIN_VISIBLE_FRACTION;
  const maxY = 1 - MIN_VISIBLE_FRACTION;

  return {
    x: Math.min(Math.max(x, minX), maxX),
    y: Math.min(Math.max(y, minY), maxY),
  };
}

export function deltaPxToFraction(
  deltaX: number,
  deltaY: number,
  canvasWidth: number,
  canvasHeight: number,
): { x: number; y: number } {
  return {
    x: deltaX / canvasWidth,
    y: deltaY / canvasHeight,
  };
}
