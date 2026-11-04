import { GRID_UNIT_MM } from '../constants.js';

/**
 * Fills in dimensionsMm from gridSize (1 grid unit = 20 mm) unless the caller
 * supplied dimensionsMm explicitly. Returns a new object; the input is untouched.
 */
export function withDimensions(body) {
  const grid = body?.gridSize;
  if (!grid || typeof grid !== 'object' || body.dimensionsMm) return body;

  const { length, width, height } = grid;
  if (![length, width, height].every((n) => typeof n === 'number' && Number.isFinite(n))) return body;

  return {
    ...body,
    dimensionsMm: {
      length: length * GRID_UNIT_MM,
      width: width * GRID_UNIT_MM,
      height: height * GRID_UNIT_MM,
    },
  };
}
