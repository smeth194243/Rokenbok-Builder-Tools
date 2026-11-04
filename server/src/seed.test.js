import { test } from 'node:test';
import assert from 'node:assert/strict';
import Part from './models/Part.js';
import { parts as seedData } from './data/parts.js';
import { seedParts } from './seedParts.js';
import { withDimensions } from './services/parts.js';

// ---------- the data file itself ----------
test('every seed part passes the real schema validation', () => {
  for (const raw of seedData) {
    const err = new Part(withDimensions(raw)).validateSync();
    assert.equal(err, undefined, `${raw.name}: ${err?.message}`);
  }
});

test('seed part names are unique', () => {
  const names = seedData.map((p) => p.name);
  assert.equal(new Set(names).size, names.length);
});

test('seed mm sizes (when given) match the grid size at 20 mm per unit', () => {
  for (const p of seedData.filter((x) => x.dimensionsMm)) {
    for (const k of ['length', 'width', 'height']) assert.equal(p.gridSize[k] * 20, p.dimensionsMm[k], `${p.name} ${k}`);
  }
});

test('the 7 newer parts are present', () => {
  const names = seedData.map((p) => p.name);
  for (const n of [
    'Curved Beam', 'Small Curved Beam', 'Mini Curved Beam',
    'Deck Plate', 'Half Deck Plate', 'Single Snap Cube', 'Double Snap Cube',
  ]) assert.ok(names.includes(n), n);
  assert.equal(seedData.length, 11);
});

// ---------- seeding behaviour, with a fake in-memory model ----------
function fakeModel(initial = []) {
  const rows = new Map(initial.map((p) => [p.name, p]));
  return {
    rows,
    exists: async ({ name }) => (rows.has(name) ? { _id: 1 } : null),
    create: async (part) => void rows.set(part.name, part),
    findOneAndUpdate: async ({ name }, part) => void rows.set(name, part),
  };
}

test('seeding an empty database adds everything, with mm sizes filled in', async () => {
  const model = fakeModel();
  const results = await seedParts(model, seedData);
  assert.equal(results.length, 11);
  assert.ok(results.every((r) => r.action === 'added'));
  assert.deepEqual(model.rows.get('Curved Beam').dimensionsMm, { length: 160, width: 160, height: 20 });
});

test('re-seeding keeps edits made in the app', async () => {
  const edited = { ...seedData[0], filamentGrams: 99 };
  const model = fakeModel([edited]);
  const results = await seedParts(model, seedData);
  assert.equal(results[0].action, 'kept');
  assert.equal(model.rows.get(edited.name).filamentGrams, 99); // not overwritten
  assert.equal(results.filter((r) => r.action === 'added').length, 10);
});

test('--update overwrites existing parts', async () => {
  const model = fakeModel([{ ...seedData[0], filamentGrams: 99 }]);
  const results = await seedParts(model, seedData, { update: true });
  assert.equal(results[0].action, 'updated');
  assert.equal(model.rows.get(seedData[0].name).filamentGrams, seedData[0].filamentGrams);
});
