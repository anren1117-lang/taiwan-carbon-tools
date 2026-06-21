// farms.test.mjs — schema + contract checks for farms/*.json
//
// Run: `node --test tests/farms.test.mjs` from the repo root.
// Catches schema drift between the JSON files and what the dashboard
// renderer expects. No deps; uses Node's built-in test runner.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const farmsDir = resolve(here, '..', 'farms');
const farmFiles = readdirSync(farmsDir).filter(f => f.endsWith('.json'));

function loadFarm(file) {
  return JSON.parse(readFileSync(join(farmsDir, file), 'utf8'));
}

// Required top-level keys (what dashboard renderer + cycle-3 fix expect)
const REQUIRED_TOP = [
  'clientName', 'clientLocation', 'reportingPeriod',
  'monthlyElectricity', 'yoyTotals', 'inputs'
];

// Required inputs keys — renderer + agent fit() scorers reach in here
const REQUIRED_INPUTS = [
  'farmSize', 'cropType',
  'diesel', 'gasoline', 'lpg', 'heatingOil',
  'nFert', 'irrigation', 'coldStorage', 'otherElec',
  'chemicals', 'transport', 'commute', 'packaging', 'waste',
  'biochar', 'trees',
  'practices',
  'annualYieldKg', 'annualRevenueNT'  // cycle 3 fix: annualRevenueNT required
];

const VALID_CROP_TYPES = ['rice', 'vegetables', 'fruit', 'livestock', 'mixed'];
const PRACTICE_KEYS = ['coverCrop', 'noTill', 'compost', 'residue'];

test('at least one farm JSON exists', () => {
  assert.ok(farmFiles.length > 0, 'no farms/*.json files found');
});

for (const file of farmFiles) {
  test(`${file} parses as valid JSON`, () => {
    assert.doesNotThrow(() => loadFarm(file));
  });

  test(`${file} has all required top-level keys`, () => {
    const data = loadFarm(file);
    for (const k of REQUIRED_TOP) {
      assert.ok(k in data, `missing top-level key: ${k}`);
    }
  });

  test(`${file} has all required inputs keys`, () => {
    const data = loadFarm(file);
    for (const k of REQUIRED_INPUTS) {
      assert.ok(k in data.inputs, `missing inputs.${k}`);
    }
  });

  test(`${file} cropType is in the valid enum`, () => {
    const data = loadFarm(file);
    assert.ok(VALID_CROP_TYPES.includes(data.inputs.cropType),
      `inputs.cropType=${data.inputs.cropType} not in ${VALID_CROP_TYPES.join('|')}`);
  });

  test(`${file} has bilingual clientName + clientLocation`, () => {
    const data = loadFarm(file);
    assert.ok(typeof data.clientName === 'object' && 'zh' in data.clientName && 'en' in data.clientName,
      'clientName must be { zh, en }');
    assert.ok(typeof data.clientLocation === 'object' && 'zh' in data.clientLocation && 'en' in data.clientLocation,
      'clientLocation must be { zh, en }');
  });

  test(`${file} practices object has all 4 keys`, () => {
    const data = loadFarm(file);
    const p = data.inputs.practices;
    assert.ok(p && typeof p === 'object', 'inputs.practices must be an object');
    for (const k of PRACTICE_KEYS) {
      assert.ok(k in p, `missing inputs.practices.${k} (renderer at farm-dashboard.html:4550 expects all 4)`);
      assert.equal(typeof p[k], 'boolean', `inputs.practices.${k} must be boolean`);
    }
  });

  test(`${file} monthlyElectricity has no duplicate year keys (lai-mango cycle-2 bug)`, () => {
    // JSON.parse silently overwrites dupes, so re-parse raw to detect
    const raw = readFileSync(join(farmsDir, file), 'utf8');
    const me = raw.match(/"monthlyElectricity"\s*:\s*\{([\s\S]*?)\}/);
    if (me) {
      const yearKeys = (me[1].match(/"(\d{4})"\s*:/g) || []).map(s => s.match(/(\d{4})/)[1]);
      const seen = new Set();
      for (const y of yearKeys) {
        assert.ok(!seen.has(y), `duplicate "${y}" key in monthlyElectricity — second silently overwrites first`);
        seen.add(y);
      }
    }
  });

  test(`${file} monthlyElectricity arrays have valid lengths (1-12)`, () => {
    const data = loadFarm(file);
    const me = data.monthlyElectricity || {};
    for (const [year, arr] of Object.entries(me)) {
      assert.ok(Array.isArray(arr), `monthlyElectricity.${year} must be an array`);
      assert.ok(arr.length >= 1 && arr.length <= 12, `monthlyElectricity.${year} length ${arr.length} not in [1,12]`);
      for (const n of arr) {
        assert.equal(typeof n, 'number', `monthlyElectricity.${year} contains non-number`);
      }
    }
  });

  test(`${file} annualRevenueNT is a positive number (cycle 3 fix)`, () => {
    const data = loadFarm(file);
    const r = data.inputs.annualRevenueNT;
    assert.equal(typeof r, 'number', `inputs.annualRevenueNT must be a number (cycle 3 found it was silently null across all farms)`);
    assert.ok(r > 0, `inputs.annualRevenueNT=${r} must be > 0 or 18+ fit-scorers collapse to "no revenue" branch`);
  });

  test(`${file} contact (if present) is well-formed`, () => {
    const data = loadFarm(file);
    if (!data.contact) return; // optional
    assert.equal(typeof data.contact, 'object', 'contact must be an object');
    if (data.contact.name) {
      assert.ok(data.contact.name.zh || data.contact.name.en, 'contact.name must have zh or en');
    }
  });
}
