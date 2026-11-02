import { test } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import footprintRouter from './routes/footprint.js';
import {
  blocksForUnits,
  calculateFootprint,
  parseFootprintRequest,
  unitsForBlocks,
} from './services/footprint.js';

test('blocks: first block is cube + beam + cube (9 units), then +8 each', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map(unitsForBlocks), [0, 9, 17, 25, 33]);
});

test('blocksForUnits is the inverse, rounding down', () => {
  const cases = [[0, 0], [1, 0], [8, 0], [9, 1], [16, 1], [17, 2], [30, 3], [33, 4]];
  for (const [units, blocks] of cases) assert.equal(blocksForUnits(units), blocks, `${units} units`);
});

test('one block is 180 mm', () => {
  const r = calculateFootprint({ unit: 'blocks', length: 1, width: 1 });
  assert.equal(r.dimensions.length.exact.mm, 180);
  assert.equal(r.dimensions.length.fit.units, 9);
});

test('grid dimensions in, physical measurements out', () => {
  const r = calculateFootprint({ unit: 'blocks', length: 3, width: 2 });
  assert.equal(r.dimensions.length.exact.mm, 500); // 25 units
  assert.equal(r.dimensions.length.exact.in, 19.685);
  assert.equal(r.dimensions.width.exact.mm, 340); // 17 units
  // converting back gives the same grid size
  assert.equal(r.dimensions.length.fit.blocks, 3);
  assert.equal(r.dimensions.length.fit.units, 25);
  assert.equal(r.area.exact.mm2, 500 * 340);
  assert.equal(r.area.fit.cells, 25 * 17);
  assert.equal(r.dimensions.height, undefined);
});

test('physical dimensions in, maximum grid size out', () => {
  const r = calculateFootprint({ unit: 'in', length: 24, width: 12, height: 6 });
  // 24 in = 609.6 mm -> 30 whole units -> 3 blocks (25 units); 4 blocks would need 33
  assert.equal(r.dimensions.length.fit.units, 30);
  assert.equal(r.dimensions.length.fit.blocks, 3);
  assert.equal(r.dimensions.length.fit.slackMm, 9.6);
  // 12 in = 304.8 mm -> 15 units -> 1 block (9 units); 2 blocks would need 17
  assert.equal(r.dimensions.width.fit.units, 15);
  assert.equal(r.dimensions.width.fit.blocks, 1);
  // height 6 in = 152.4 mm -> 7 units, not enough for a block
  assert.equal(r.dimensions.height.fit.units, 7);
  assert.equal(r.dimensions.height.fit.blocks, 0);
});

test('area conversions: 3 ft x 2 ft', () => {
  const r = calculateFootprint({ unit: 'ft', length: 3, width: 2 });
  assert.equal(r.area.exact.ft2, 6);
  assert.equal(r.area.exact.in2, 864);
});

test('smaller than one cube fits nothing', () => {
  const r = calculateFootprint({ unit: 'mm', length: 19, width: 100 });
  assert.equal(r.dimensions.length.fit.units, 0);
  assert.equal(r.dimensions.length.fit.blocks, 0);
  assert.equal(r.area.fit.cells, 0);
});

test('exact multiples are not lost to floating point', () => {
  // 0.6 m = 600 mm = exactly 30 units even though 0.6 * 1000 is not exactly 600
  const r = calculateFootprint({ unit: 'm', length: 0.6, width: 0.2 });
  assert.equal(r.dimensions.length.fit.units, 30);
  assert.equal(r.dimensions.width.fit.units, 10);
});

test('parseFootprintRequest rejects bad input', () => {
  const bad = [
    null,
    {},
    { unit: 'furlongs', length: 1, width: 1 },
    { unit: 'mm', width: 5 },
    { unit: 'mm', length: 5 },
    { unit: 'mm', length: 0, width: 5 },
    { unit: 'mm', length: -3, width: 5 },
    { unit: 'mm', length: '5', width: 5 },
    { unit: 'blocks', length: 2.5, width: 2 },
    { unit: 'units', length: 2, width: 2, height: 1.5 },
    { unit: 'mm', length: 5e9, width: 5 },
  ];
  for (const body of bad) {
    assert.throws(() => parseFootprintRequest(body), (e) => e.status === 400, JSON.stringify(body));
  }
});

test('POST /api/footprint/calculate over HTTP', async (t) => {
  const app = express();
  app.use(express.json());
  app.use('/api/footprint', footprintRouter);
  app.use((err, req, res, next) => res.status(err.status || 500).json({ error: err.message }));
  const server = app.listen(0);
  t.after(() => server.close());
  const url = `http://127.0.0.1:${server.address().port}/api/footprint/calculate`;
  const post = (body) =>
    fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

  const ok = await post({ unit: 'ft', length: 4, width: 3 });
  assert.equal(ok.status, 200);
  const data = await ok.json();
  assert.equal(data.dimensions.length.fit.units, 60); // 1219.2 mm
  assert.equal(data.dimensions.length.fit.blocks, 7); // 57 units; an 8th block would need 65
  assert.equal((await post({ unit: 'ft', length: 4 })).status, 400);
});
