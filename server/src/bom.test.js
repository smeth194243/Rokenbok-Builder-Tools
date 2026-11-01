import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import Part from './models/Part.js';
import bomRouter from './routes/bom.js';
import { calculateBom, parseBomRequest } from './services/bom.js';
import { parts as seedParts } from './data/parts.js';

// Give the seed parts fake ids so we can test without a database.
const ids = ['a'.repeat(24), 'b'.repeat(24), 'c'.repeat(24), 'd'.repeat(24)];
const parts = seedParts.map((p, i) => ({ ...p, _id: ids[i] }));
const [CUBE, FULL, HALF, RISER] = ids;
const opts = { costPerKg: 20, spoolGrams: 1000 };

test('calculates totals for a mixed build', () => {
  const { lines, totals } = calculateBom(
    parts,
    [
      { partId: CUBE, quantity: 10 },
      { partId: FULL, quantity: 4 },
      { partId: RISER, quantity: 2 },
    ],
    opts
  );
  // 10*2.6 + 4*17 + 2*5.05 = 26 + 68 + 10.1 = 104.1 g
  assert.equal(totals.filamentGrams, 104.1);
  // 10*605 + 4*2940 + 2*976 = 6050 + 11760 + 1952
  assert.equal(totals.printTimeSeconds, 19762);
  assert.equal(totals.partCount, 16);
  assert.equal(totals.uniqueParts, 3);
  assert.equal(totals.cost, 2.08); // 0.1041 kg * $20
  assert.equal(totals.spools.spoolsUsed, 0.1);
  assert.equal(totals.spools.spoolsToBuy, 1);
  assert.equal(lines[1].filamentGrams, 68);
  // per-line cost subtotals: 26 g, 68 g and 10.1 g at $20/kg
  assert.deepEqual(lines.map((l) => l.cost), [0.52, 1.36, 0.2]);
});

test('spoolsToBuy rounds up past one spool', () => {
  const { totals } = calculateBom(parts, [{ partId: FULL, quantity: 70 }], opts); // 1190 g
  assert.equal(totals.spools.spoolsUsed, 1.19);
  assert.equal(totals.spools.spoolsToBuy, 2);
});

test('empty build gives zeros', () => {
  const { lines, totals } = calculateBom(parts, [], opts);
  assert.deepEqual(lines, []);
  assert.equal(totals.filamentGrams, 0);
  assert.equal(totals.cost, 0);
  assert.equal(totals.spools.spoolsToBuy, 0);
});

test('unknown part is a 404', () => {
  assert.throws(
    () => calculateBom(parts, [{ partId: 'e'.repeat(24), quantity: 1 }], opts),
    (err) => err.status === 404
  );
});

test('parseBomRequest merges duplicates and applies defaults', () => {
  const req = parseBomRequest({
    items: [
      { partId: CUBE, quantity: 2 },
      { partId: CUBE, quantity: 3 },
    ],
  });
  assert.deepEqual(req.items, [{ partId: CUBE, quantity: 5 }]);
  assert.equal(req.costPerKg, 0);
  assert.equal(req.spoolGrams, 1000);
});

test('parseBomRequest rejects bad input', () => {
  const bad = [
    null,
    {},
    { items: 'nope' },
    { items: [{ partId: 'abc', quantity: 1 }] },
    { items: [{ partId: CUBE, quantity: 0 }] },
    { items: [{ partId: CUBE, quantity: 1.5 }] },
    { items: [{ partId: CUBE, quantity: '3' }] },
    { items: [], costPerKg: -5 },
    { items: [], costPerKg: '20' },
    { items: [], spoolGrams: 0 },
  ];
  for (const body of bad) {
    assert.throws(() => parseBomRequest(body), (err) => err.status === 400, JSON.stringify(body));
  }
});

// --- HTTP-level test with the database lookup stubbed out ---
test('POST /api/bom/calculate over HTTP', async (t) => {
  const originalFind = Part.find;
  Part.find = () => ({ lean: async () => parts });
  t.after(() => {
    Part.find = originalFind;
  });

  const app = express();
  app.use(express.json());
  app.use('/api/bom', bomRouter);
  app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
  const server = app.listen(0);
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}/api/bom/calculate`;

  const post = (body) =>
    fetch(base, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  const ok = await post({ items: [{ partId: HALF, quantity: 3 }], costPerKg: 25 });
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.totals.filamentGrams, 22.59);
  assert.equal(data.totals.cost, 0.56);

  const bad = await post({ items: [{ partId: HALF, quantity: -1 }] });
  assert.equal(bad.status, 400);
});
