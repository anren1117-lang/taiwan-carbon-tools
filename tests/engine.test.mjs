// engine.test.mjs — golden tests for farm-carbon-engine.js
//
// Run: `node --test tests/engine.test.mjs` from the repo root.
// No deps. The engine is a classic script (no module exports) so we
// load it into a fresh vm context and grab the globals it defines.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import vm from 'node:vm';

const here = dirname(fileURLToPath(import.meta.url));
const engineSrc = readFileSync(resolve(here, '..', 'farm-carbon-engine.js'), 'utf8');

// `const`-declared top-level bindings in vm.runInContext do NOT
// attach to the context globalThis (only `function` declarations
// hoist as globals). Append a small re-export tail so the test can
// pull the data tables + helpers off the returned context.
const ENGINE_EXPORT_TAIL = `;Object.assign(globalThis, {
  EF, SINK, PRACTICES, PRODUCT_BENCHMARKS, MANURE_MULT, RICE_MGMT_SCALE,
  stackingMult, calcFromInputs, fmt, fmt0, yearsSince
});`;

function loadEngine() {
  const ctx = vm.createContext({});
  vm.runInContext(engineSrc + ENGINE_EXPORT_TAIL, ctx);
  return ctx;
}

// Floating-point tolerant equality — engine math is straightforward
// multiplication so 1e-6 is plenty wide.
function near(actual, expected, eps = 1e-6, msg = '') {
  assert.ok(Math.abs(actual - expected) < eps,
    `${msg || 'near'}: expected ≈ ${expected}, got ${actual}`);
}

// Empty / zeroed inputs — all required keys present, all zero
function blankInputs(over = {}) {
  return Object.assign({
    farmSize: 0, cropType: 'mixed',
    diesel: 0, gasoline: 0, lpg: 0, heatingOil: 0,
    nFert: 0, riceMgmt: 'continuous_flood',
    cattle: 0, pigs: 0, poultry: 0,
    cattleDairy: 0, cattleBeef: 0,
    sowHead: 0, growerPigHead: 0,
    poultryLayer: 0, poultryBroiler: 0,
    manure: 'none',
    irrigation: 0, coldStorage: 0, otherElec: 0,
    chemicals: 0, feed: 0, transport: 0, commute: 0, packaging: 0, waste: 0,
    biochar: 0, trees: 0,
    practices: { coverCrop: false, noTill: false, compost: false, residue: false }
  }, over);
}

test('engine loads + exposes expected globals', () => {
  const ctx = loadEngine();
  for (const k of ['EF', 'SINK', 'PRACTICES', 'calcFromInputs', 'stackingMult', 'fmt', 'fmt0', 'yearsSince']) {
    assert.ok(k in ctx, `expected ${k} on engine context`);
  }
});

test('blank inputs → all-zero outputs', () => {
  const { calcFromInputs } = loadEngine();
  const r = calcFromInputs(blankInputs());
  assert.equal(r.s1, 0);
  assert.equal(r.s2, 0);
  assert.equal(r.s3, 0);
  assert.equal(r.gross, 0);
  assert.equal(r.sinkTotal, 0);
  assert.equal(r.net, 0);
});

test('diesel 100 L → 260.6 kg CO2e via Scope 1', () => {
  const { calcFromInputs, EF } = loadEngine();
  assert.equal(EF.diesel, 2.606); // sanity: factor matches MOENV reference
  const r = calcFromInputs(blankInputs({ diesel: 100 }));
  near(r.s1, 260.6);
  near(r.fuels.diesel, 260.6);
  assert.equal(r.s2, 0);
  assert.equal(r.s3, 0);
});

test('electricity 1000 kWh → 474 kg via Scope 2', () => {
  const { calcFromInputs, EF } = loadEngine();
  assert.equal(EF.electricity, 0.474); // MOEA 2024
  const r = calcFromInputs(blankInputs({ irrigation: 1000 }));
  near(r.s2, 474);
});

test('N fertilizer counts in BOTH s1 (N2O) AND s3 (upstream)', () => {
  const { calcFromInputs } = loadEngine();
  const r = calcFromInputs(blankInputs({ nFert: 10 }));
  // s1: 10 × 4.29 = 42.9 ; s3: 10 × 4.0 = 40
  near(r.s1, 42.9);
  near(r.scope3.nFertUp, 40);
});

test('rice farm fires CH4; non-rice does NOT', () => {
  const { calcFromInputs, EF } = loadEngine();
  const rice = calcFromInputs(blankInputs({ cropType: 'rice', farmSize: 1 }));
  assert.equal(rice.sources.rice, EF.riceCH4PerHa); // 1 ha × 2970 × 1.0 (continuous_flood)
  const veg = calcFromInputs(blankInputs({ cropType: 'vegetables', farmSize: 1 }));
  assert.equal(veg.sources.rice, 0);
});

test('rice AWD management cuts CH4 ~45-50%', () => {
  const { calcFromInputs } = loadEngine();
  const flood = calcFromInputs(blankInputs({ cropType: 'rice', farmSize: 1, riceMgmt: 'continuous_flood' }));
  const awd   = calcFromInputs(blankInputs({ cropType: 'rice', farmSize: 1, riceMgmt: 'awd' }));
  assert.ok(awd.sources.rice < flood.sources.rice * 0.6, 'AWD should cut CH4 by >40%');
});

test('livestock sub-class fields override single-field totals when set', () => {
  const { calcFromInputs, EF } = loadEngine();
  // With only inp.cattle, falls back to single-field factor
  const single = calcFromInputs(blankInputs({ cattle: 1 }));
  assert.equal(single.sources.livestock, EF.cattleHead);
  // With inp.cattleDairy set, uses dairy factor instead
  const dairy = calcFromInputs(blankInputs({ cattle: 1, cattleDairy: 1 }));
  assert.equal(dairy.sources.livestock, EF.cattleDairy);
});

test('manure management multipliers compound livestock emissions', () => {
  const { calcFromInputs, EF } = loadEngine();
  const none    = calcFromInputs(blankInputs({ cattle: 1, manure: 'none' }));
  const lagoon  = calcFromInputs(blankInputs({ cattle: 1, manure: 'lagoon' }));
  assert.equal(none.sources.livestock, EF.cattleHead * 1.0);
  assert.equal(lagoon.sources.livestock, EF.cattleHead * 1.3);
});

test('cover-crop sink scales with farm size + practice activation', () => {
  const { calcFromInputs, SINK } = loadEngine();
  const off = calcFromInputs(blankInputs({ farmSize: 2 }));
  const on  = calcFromInputs(blankInputs({
    farmSize: 2,
    practices: { coverCrop: true, noTill: false, compost: false, residue: false }
  }));
  assert.equal(off.sinkByPractice.coverCrop, 0);
  // single practice: stackingMult(1) = 1.0
  near(on.sinkByPractice.coverCrop, 2 * SINK.coverCrop * 1.0);
});

test('practice stacking applies a non-linear multiplier', () => {
  const { calcFromInputs, stackingMult } = loadEngine();
  const r2 = calcFromInputs(blankInputs({
    farmSize: 1,
    practices: { coverCrop: true, compost: true, noTill: false, residue: false }
  }));
  const expectedMult = stackingMult(2);
  assert.equal(r2.stackingMult, expectedMult);
  assert.equal(r2.activeLandCount, 2);
});

test('biochar + trees count toward sinks at fixed rates', () => {
  const { calcFromInputs, SINK } = loadEngine();
  const r = calcFromInputs(blankInputs({ biochar: 10, trees: 5 }));
  near(r.sinkByPractice.biochar, 10 * SINK.biochar);
  near(r.sinkByPractice.trees, 5 * SINK.treePerYear);
});

test('net = gross - sinkTotal (invariant)', () => {
  const { calcFromInputs } = loadEngine();
  const r = calcFromInputs(blankInputs({
    diesel: 50, irrigation: 500, nFert: 20, trees: 10,
    practices: { coverCrop: true, compost: true, residue: true, noTill: false }
  }));
  near(r.net, r.gross - r.sinkTotal);
});

test('sources electricity equals s2 (Scope 2 has no other sources)', () => {
  const { calcFromInputs } = loadEngine();
  const r = calcFromInputs(blankInputs({ irrigation: 800, coldStorage: 200, otherElec: 100 }));
  near(r.s2, r.sources.electricity);
  near(r.s2, 1100 * 0.474); // sanity vs MOEA factor
});

test('sources.nFert combines direct N2O + upstream urea (s1 + s3 portions)', () => {
  const { calcFromInputs } = loadEngine();
  const r = calcFromInputs(blankInputs({ nFert: 10 }));
  near(r.sources.nFert, r.s1 + r.scope3.nFertUp);
});

test('fmt / fmt0 format numbers without throwing on edge cases', () => {
  const { fmt, fmt0 } = loadEngine();
  assert.equal(typeof fmt(0), 'string');
  assert.equal(typeof fmt0(0), 'string');
  assert.equal(typeof fmt(1234.5678, 2), 'string');
  assert.ok(fmt(0).includes('0'));
});

test('yearsSince returns 1-decimal float using mid-year reference (refYr + 0.5)', () => {
  const { yearsSince } = loadEngine();
  // 2020-01 → 2020.0; ref 2025 → 2025.5; diff = 5.5
  assert.equal(yearsSince('2020-01', '2025'), 5.5);
  // 2023-06 → 2023 + 5/12 ≈ 2023.4167; ref 2025.5; diff ≈ 2.1
  near(yearsSince('2023-06', '2025'), 2.1, 0.05);
  assert.equal(yearsSince(null, '2025'), null);
  assert.equal(yearsSince('', '2025'), null);
  // Future date returns null (no negative years)
  assert.equal(yearsSince('2030-01', '2025'), null);
});
