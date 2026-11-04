import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import Part from './models/Part.js';
import partsRouter from './routes/parts.js';
import { errorHandler } from './middleware/errors.js';
import { withDimensions } from './services/parts.js';

const goodPart = {
  name: 'Plate 4x4',
  category: 'Plate',
  description: 'Flat plate',
  gridSize: { length: 4, width: 4, height: 1 },
  dimensionsMm: { length: 80, width: 80, height: 20 },
  filamentGrams: 30,
  printTimeSeconds: 5400,
  modelUrl: 'https://example.com/plate',
};

// ---------- withDimensions ----------
test('withDimensions derives mm from grid units (20 mm each)', () => {
  const out = withDimensions({ name: 'x', gridSize: { length: 7, width: 1, height: 1 } });
  assert.deepEqual(out.dimensionsMm, { length: 140, width: 20, height: 20 });
});

test('withDimensions keeps explicit dimensions and does not mutate input', () => {
  const explicit = { gridSize: { length: 2, width: 1, height: 1 }, dimensionsMm: { length: 39, width: 20, height: 20 } };
  assert.equal(withDimensions(explicit), explicit);
  const input = { gridSize: { length: 1, width: 1, height: 1 } };
  withDimensions(input);
  assert.equal(input.dimensionsMm, undefined);
});

test('withDimensions leaves bodies without a usable gridSize alone', () => {
  for (const body of [{}, { gridSize: null }, { gridSize: { length: 'a', width: 1, height: 1 } }, null]) {
    assert.equal(withDimensions(body), body);
  }
});

// ---------- schema validation ----------
const errorsFor = (overrides) => {
  const err = new Part({ ...goodPart, ...overrides }).validateSync();
  return err ? Object.values(err.errors).map((e) => e.message) : [];
};

test('a valid part passes, and category is normalised', () => {
  assert.deepEqual(errorsFor({}), []);
  assert.equal(new Part(goodPart).category, 'plate');
});

test('any category is allowed now (no fixed list)', () => {
  assert.deepEqual(errorsFor({ category: 'wheel' }), []);
});

test('grid sizes must be whole numbers of at least 1', () => {
  assert.ok(errorsFor({ gridSize: { length: 0, width: 1, height: 1 } }).length > 0);
  assert.ok(errorsFor({ gridSize: { length: 1.5, width: 1, height: 1 } }).length > 0);
});

test('required fields, ranges and URL format are enforced', () => {
  assert.ok(errorsFor({ name: '' }).includes('Name is required'));
  assert.ok(errorsFor({ category: '' }).includes('Category is required'));
  assert.ok(errorsFor({ filamentGrams: -1 }).includes('Filament weight cannot be negative'));
  assert.ok(errorsFor({ printTimeSeconds: 0 }).includes('Print time must be at least 1 second'));
  assert.ok(errorsFor({ modelUrl: 'not a url' }).includes('Model link must start with http:// or https://'));
  assert.deepEqual(errorsFor({ modelUrl: '' }), []); // optional
});

// ---------- HTTP: real routes + real validation, database calls stubbed ----------
test('POST / PUT / DELETE over HTTP', async (t) => {
  const store = new Map();
  let nextId = 1;
  const id = () => (nextId++).toString(16).padStart(24, '0');

  Part.create = async (body) => {
    const doc = new Part(body);
    await doc.validate();
    if ([...store.values()].some((p) => p.name === doc.name)) throw Object.assign(new Error('dup'), { code: 11000 });
    const obj = { ...doc.toObject(), _id: id() };
    store.set(obj._id, obj);
    return obj;
  };
  Part.findByIdAndUpdate = async (partId, body) => {
    const existing = store.get(partId);
    if (!existing) return null;
    const doc = new Part({ ...existing, ...body });
    await doc.validate();
    const obj = { ...doc.toObject(), _id: partId };
    store.set(partId, obj);
    return obj;
  };
  Part.findByIdAndDelete = async (partId) => {
    const existing = store.get(partId);
    store.delete(partId);
    return existing ?? null;
  };
  t.after(() => {
    // remove the stubs so the real inherited model methods are used again
    delete Part.create;
    delete Part.findByIdAndUpdate;
    delete Part.findByIdAndDelete;
  });

  const app = express();
  app.use(express.json());
  app.use('/api/parts', partsRouter);
  app.use(errorHandler);
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/parts`;
  const call = (method, path, body) =>
    fetch(base + path, { method, headers: { 'content-type': 'application/json' }, body: body && JSON.stringify(body) });

  // create without dimensionsMm: the server derives it
  const { dimensionsMm: _omit, ...noDims } = goodPart;
  const created = await call('POST', '', noDims);
  assert.equal(created.status, 201);
  const part = await created.json();
  assert.deepEqual(part.dimensionsMm, { length: 80, width: 80, height: 20 });
  assert.equal(part.category, 'plate');

  // duplicate name -> 409
  assert.equal((await call('POST', '', noDims)).status, 409);

  // validation errors come back as one readable message
  const bad = await call('POST', '', { ...noDims, name: 'Other', filamentGrams: -5, printTimeSeconds: 0 });
  assert.equal(bad.status, 400);
  const badBody = await bad.json();
  assert.match(badBody.error, /Filament weight cannot be negative/);
  assert.match(badBody.error, /Print time must be at least 1 second/);

  // update: changing the grid size re-derives the mm size
  const updated = await call('PUT', `/${part._id}`, { gridSize: { length: 2, width: 3, height: 1 }, filamentGrams: 9.5 });
  assert.equal(updated.status, 200);
  const upd = await updated.json();
  assert.deepEqual(upd.dimensionsMm, { length: 40, width: 60, height: 20 });
  assert.equal(upd.filamentGrams, 9.5);

  // unknown id -> 404, malformed id -> 400
  assert.equal((await call('PUT', `/${'f'.repeat(24)}`, { filamentGrams: 1 })).status, 404);
  assert.equal((await call('PUT', '/abc', { filamentGrams: 1 })).status, 400);

  // delete
  assert.equal((await call('DELETE', `/${part._id}`)).status, 204);
  assert.equal((await call('DELETE', `/${part._id}`)).status, 404);
});
