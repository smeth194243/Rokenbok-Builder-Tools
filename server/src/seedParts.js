import { withDimensions } from './services/parts.js';

/**
 * Loads starter parts into the database.
 *
 * By default only parts that are missing (matched by name) are added, so edits
 * made in the app survive a re-seed. With { update: true } existing parts are
 * overwritten with the values from the data file.
 *
 * Returns [{ name, action }] where action is 'added', 'kept' or 'updated'.
 */
export async function seedParts(Part, parts, { update = false } = {}) {
  const results = [];
  for (const raw of parts) {
    const part = withDimensions(raw); // fills in the mm size from the grid size
    const exists = await Part.exists({ name: part.name });

    if (!exists) {
      await Part.create(part);
      results.push({ name: part.name, action: 'added' });
    } else if (update) {
      await Part.findOneAndUpdate({ name: part.name }, part, { runValidators: true });
      results.push({ name: part.name, action: 'updated' });
    } else {
      results.push({ name: part.name, action: 'kept' });
    }
  }
  return results;
}
