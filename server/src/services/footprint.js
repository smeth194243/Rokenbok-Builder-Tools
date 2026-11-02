// Footprint math: convert between blocks, grid units and real-world sizes.
// Pure functions (no database) so they are easy to unit test.
import { BLOCK_BASE_UNITS, BLOCK_PITCH_UNITS, GRID_UNIT_MM } from '../constants.js';
import { HttpError } from './bom.js';

export const MM_PER = { mm: 1, cm: 10, in: 25.4, ft: 304.8, m: 1000 };
// 'blocks' and 'units' are whole-number grid measurements.
export const GRID_UNITS = ['blocks', 'units'];
export const UNITS = [...GRID_UNITS, ...Object.keys(MM_PER)];
export const MAX_VALUE = 1_000_000;

const round = (n, digits) => {
  const f = 10 ** digits;
  return Math.round((n + Number.EPSILON) * f) / f;
};
// Floor with a tiny tolerance so 600.0000000001 mm still counts as 30 units.
const floorSafe = (n) => Math.floor(n + 1e-9);

/** Grid units spanned by n blocks in a row: 9, 17, 25, ... (0 blocks = nothing). */
export const unitsForBlocks = (blocks) => (blocks <= 0 ? 0 : BLOCK_BASE_UNITS + BLOCK_PITCH_UNITS * blocks);

/** The most whole blocks that fit in a number of grid units (0 if not even one fits). */
export const blocksForUnits = (units) =>
  units < BLOCK_BASE_UNITS + BLOCK_PITCH_UNITS ? 0 : Math.floor((units - BLOCK_BASE_UNITS) / BLOCK_PITCH_UNITS);

/** Any supported measurement to millimetres. */
export function toMm(value, unit) {
  if (unit === 'blocks') return unitsForBlocks(value) * GRID_UNIT_MM;
  if (unit === 'units') return value * GRID_UNIT_MM;
  return value * MM_PER[unit];
}

function convertDimension(mm) {
  const units = floorSafe(mm / GRID_UNIT_MM);
  const blocks = blocksForUnits(units);
  return {
    exact: {
      mm: round(mm, 3),
      cm: round(mm / MM_PER.cm, 3),
      in: round(mm / MM_PER.in, 3),
      ft: round(mm / MM_PER.ft, 3),
      m: round(mm / MM_PER.m, 4),
    },
    // The largest whole grid size that fits inside the measurement.
    fit: {
      units,
      blocks,
      unitsMm: units * GRID_UNIT_MM,
      blocksMm: unitsForBlocks(blocks) * GRID_UNIT_MM,
      slackMm: round(mm - units * GRID_UNIT_MM, 3), // left over after whole units
    },
  };
}

const areaOf = (aMm, bMm) => ({
  mm2: round(aMm * bMm, 2),
  cm2: round((aMm * bMm) / MM_PER.cm ** 2, 2),
  in2: round((aMm * bMm) / MM_PER.in ** 2, 2),
  ft2: round((aMm * bMm) / MM_PER.ft ** 2, 3),
  m2: round((aMm * bMm) / MM_PER.m ** 2, 4),
});

/**
 * Validates a request body: { unit, length, width, height? }.
 * Every dimension uses the same unit.
 */
export function parseFootprintRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const { unit } = body;
  if (!UNITS.includes(unit)) {
    throw new HttpError(400, `unit must be one of: ${UNITS.join(', ')}`);
  }

  const dims = {};
  for (const [name, required] of [['length', true], ['width', true], ['height', false]]) {
    const value = body[name];
    if (value === undefined || value === null) {
      if (required) throw new HttpError(400, `${name} is required`);
      continue;
    }
    if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0 || value > MAX_VALUE) {
      throw new HttpError(400, `${name} must be a number greater than 0 and at most ${MAX_VALUE}`);
    }
    if (GRID_UNITS.includes(unit) && !Number.isInteger(value)) {
      throw new HttpError(400, `${name} must be a whole number when the unit is ${unit}`);
    }
    dims[name] = value;
  }
  return { unit, ...dims };
}

/** Returns per-dimension conversions plus floor area. */
export function calculateFootprint({ unit, length, width, height }) {
  const lengthMm = toMm(length, unit);
  const widthMm = toMm(width, unit);

  const dimensions = {
    length: convertDimension(lengthMm),
    width: convertDimension(widthMm),
  };
  if (height !== undefined) dimensions.height = convertDimension(toMm(height, unit));

  const fitLengthMm = dimensions.length.fit.unitsMm;
  const fitWidthMm = dimensions.width.fit.unitsMm;

  return {
    unit,
    dimensions,
    area: {
      exact: areaOf(lengthMm, widthMm),
      fit: {
        cells: dimensions.length.fit.units * dimensions.width.fit.units,
        ...areaOf(fitLengthMm, fitWidthMm),
      },
    },
  };
}
