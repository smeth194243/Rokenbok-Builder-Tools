// Bill-of-materials math. Pure functions (no database access) so they are
// easy to unit test. The route in routes/bom.js handles loading the parts.

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const MAX_QUANTITY = 100000;
export const DEFAULT_SPOOL_GRAMS = 1000;

const OBJECT_ID = /^[0-9a-f]{24}$/i;
const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Validates a request body and returns a clean version of it.
 * Duplicate partIds are merged by adding their quantities.
 */
export function parseBomRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new HttpError(400, 'Request body must be a JSON object');
  }
  const { items, costPerKg = 0, spoolGrams = DEFAULT_SPOOL_GRAMS } = body;

  if (!Array.isArray(items)) {
    throw new HttpError(400, 'items must be an array');
  }
  if (typeof costPerKg !== 'number' || !Number.isFinite(costPerKg) || costPerKg < 0) {
    throw new HttpError(400, 'costPerKg must be a non-negative number');
  }
  if (typeof spoolGrams !== 'number' || !Number.isFinite(spoolGrams) || spoolGrams <= 0) {
    throw new HttpError(400, 'spoolGrams must be a positive number');
  }

  const merged = new Map();
  items.forEach((item, i) => {
    if (!item || typeof item.partId !== 'string' || !OBJECT_ID.test(item.partId)) {
      throw new HttpError(400, `items[${i}].partId must be a valid part id`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY) {
      throw new HttpError(400, `items[${i}].quantity must be a whole number from 1 to ${MAX_QUANTITY}`);
    }
    merged.set(item.partId, (merged.get(item.partId) ?? 0) + item.quantity);
  });

  for (const [partId, quantity] of merged) {
    if (quantity > MAX_QUANTITY) {
      throw new HttpError(400, `Total quantity for part ${partId} exceeds ${MAX_QUANTITY}`);
    }
  }

  return {
    items: [...merged].map(([partId, quantity]) => ({ partId, quantity })),
    costPerKg,
    spoolGrams,
  };
}

/**
 * parts: plain part objects (must include every partId in items)
 * items: [{ partId, quantity }]
 * Returns { lines, totals }.
 */
export function calculateBom(parts, items, { costPerKg, spoolGrams }) {
  const byId = new Map(parts.map((p) => [String(p._id), p]));

  let rawGrams = 0;
  let seconds = 0;
  let partCount = 0;

  const lines = items.map(({ partId, quantity }) => {
    const part = byId.get(partId);
    if (!part) throw new HttpError(404, `Part not found: ${partId}`);

    const grams = part.filamentGrams * quantity;
    const time = part.printTimeSeconds * quantity;
    rawGrams += grams;
    seconds += time;
    partCount += quantity;

    return {
      partId,
      name: part.name,
      quantity,
      filamentGrams: round2(grams),
      printTimeSeconds: Math.round(time),
      cost: round2((grams / 1000) * costPerKg),
    };
  });

  return {
    lines,
    totals: {
      partCount,
      uniqueParts: lines.length,
      filamentGrams: round2(rawGrams),
      printTimeSeconds: Math.round(seconds),
      costPerKg,
      cost: round2((rawGrams / 1000) * costPerKg),
      spools: {
        spoolGrams,
        // e.g. 0.63 means the build uses 63% of one spool
        spoolsUsed: round2(rawGrams / spoolGrams),
        spoolsToBuy: Math.ceil(rawGrams / spoolGrams),
      },
    },
  };
}
