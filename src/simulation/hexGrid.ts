// Hex grid using axial coordinates (q, r) with flat-top orientation.
//
// Flat-top hex geometry:
//   width  = 2 * size
//   height = √3 * size
//   horizontal spacing = 1.5 * size  (3/4 of width)
//   vertical offset for odd columns = √3/2 * size

const SQRT3 = Math.sqrt(3);

/** Convert axial hex (q, r) to pixel center (flat-top). */
export function hexToPixel(
  q: number,
  r: number,
  size: number,
): { x: number; y: number } {
  const x = size * (3 / 2) * q;
  const y = size * (SQRT3 * (r + q / 2));
  return { x, y };
}

/** Convert pixel (x, y) to fractional axial hex coordinates (flat-top). */
function pixelToFractionalHex(
  x: number,
  y: number,
  size: number,
): { q: number; r: number } {
  const q = (2 / 3) * (x / size);
  const r = (-1 / 3) * (x / size) + (SQRT3 / 3) * (y / size);
  return { q, r };
}

/** Round fractional axial coordinates to nearest hex using cube rounding. */
function axialRound(qFrac: number, rFrac: number): { q: number; r: number } {
  const sFrac = -qFrac - rFrac;
  let q = Math.round(qFrac);
  let r = Math.round(rFrac);
  const s = Math.round(sFrac);

  const qDiff = Math.abs(q - qFrac);
  const rDiff = Math.abs(r - rFrac);
  const sDiff = Math.abs(s - sFrac);

  if (qDiff > rDiff && qDiff > sDiff) {
    q = -r - s;
  } else if (rDiff > sDiff) {
    r = -q - s;
  }
  // else s gets corrected, but we only need q, r

  return { q, r };
}

/** Convert pixel position to nearest axial hex coordinate. */
export function pixelToHex(
  x: number,
  y: number,
  size: number,
): { q: number; r: number } {
  const frac = pixelToFractionalHex(x, y, size);
  return axialRound(frac.q, frac.r);
}

/** Get the 6 corner points of a flat-top hex centered at (cx, cy). */
export function hexCorners(
  cx: number,
  cy: number,
  size: number,
): Array<{ x: number; y: number }> {
  const corners: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const angleDeg = 60 * i;
    const angleRad = (Math.PI / 180) * angleDeg;
    corners.push({
      x: cx + size * Math.cos(angleRad),
      y: cy + size * Math.sin(angleRad),
    });
  }
  return corners;
}

/** String key for a hex coordinate — used as Map key. */
export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

/** Visit-count grid: sparse map from hex key to visit count. */
export type HexGrid = Map<string, number>;

export function createGrid(): HexGrid {
  return new Map();
}

export function recordVisit(grid: HexGrid, q: number, r: number): void {
  const key = hexKey(q, r);
  grid.set(key, (grid.get(key) ?? 0) + 1);
}

export function getVisitCount(grid: HexGrid, q: number, r: number): number {
  return grid.get(hexKey(q, r)) ?? 0;
}

/**
 * Compute the pixel-space bounding box of the hex grid.
 * Grid spans q ∈ [0, cols-1], r adjusted so the grid is roughly rectangular.
 * Returns { minX, minY, maxX, maxY, originX, originY } where origin is center of grid.
 */
export function gridPixelBounds(
  cols: number,
  rows: number,
  size: number,
): { width: number; height: number; offsetX: number; offsetY: number } {
  // For a flat-top hex grid, we use offset coordinates for layout:
  // Column span in pixels: (cols - 1) * 1.5 * size + 2 * size
  // Row span in pixels: rows * √3 * size  (+ half-row offset for odd cols)
  const width = (cols - 1) * 1.5 * size + 2 * size;
  const height = rows * SQRT3 * size + (SQRT3 / 2) * size;

  // Offsets to shift the axial origin (0,0) to the center of the canvas
  const c = centerHex(cols, rows);
  const center = hexToPixel(c.q, c.r, size);

  return { width, height, offsetX: -center.x, offsetY: -center.y };
}

/** Return the center hex of the grid in axial coordinates. */
export function centerHex(
  cols: number,
  rows: number,
): { q: number; r: number } {
  const q = Math.floor(cols / 2);
  const r = Math.floor(rows / 2) - Math.floor(q / 2);
  return { q, r };
}

/** Check if an axial hex coordinate is within the grid bounds. */
export function isValidHex(
  q: number,
  r: number,
  cols: number,
  rows: number,
): boolean {
  if (q < 0 || q >= cols) return false;
  const rMin = -Math.floor(q / 2);
  const rMax = rows - 1 - Math.floor(q / 2);
  return r >= rMin && r <= rMax;
}

/** Clamp an axial hex coordinate to the nearest valid grid position. */
export function clampHex(
  q: number,
  r: number,
  cols: number,
  rows: number,
): { q: number; r: number } {
  q = Math.max(0, Math.min(cols - 1, q));
  const rMin = -Math.floor(q / 2);
  const rMax = rows - 1 - Math.floor(q / 2);
  r = Math.max(rMin, Math.min(rMax, r));
  return { q, r };
}

/**
 * Iterate all hex positions in the grid (offset-style rectangular bounds).
 * Yields axial (q, r) for each tile.
 */
export function* allHexes(
  cols: number,
  rows: number,
): Generator<{ q: number; r: number }> {
  for (let q = 0; q < cols; q++) {
    for (let r = 0; r < rows; r++) {
      // Offset r by -floor(q/2) to create rectangular layout in axial coords
      yield { q, r: r - Math.floor(q / 2) };
    }
  }
}
