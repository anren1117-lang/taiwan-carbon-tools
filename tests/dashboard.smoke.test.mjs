// dashboard.smoke.test.mjs — structural smoke tests for farm-dashboard.html
//
// Catches accidental removal / renaming of load-bearing IDs, mounts,
// and meta tags. Runs against the raw HTML (no browser) so it stays
// dep-free and fast.
//
// Run: `node --test tests/dashboard.smoke.test.mjs`

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(resolve(here, '..', 'farm-dashboard.html'), 'utf8');

// Required IDs the JS reaches into (grep targets — these must exist
// or render() / event wiring will throw NPE)
const REQUIRED_IDS = [
  'clientName', 'clientLocation', 'clientFarmSize', 'clientCropLabel',
  'reportingPeriod',
  'moneyCost', 'moneyIncome',
  'agentQuestion', 'agentAskForm', 'agentReset', 'agentBody',
  'agentRecent', 'agentBrowseBody', 'agentBrowseCount',
  'agentBrowseSearch', 'agentBrowseClear', 'agentBrowseEmpty',
  'agentSavedPanel', 'agentSavedBody', 'agentSavedCount',
  'cashFlowContent',
  'farmSize', 'cropType', 'diesel', 'gasoline', 'lpg',
  'nFert', 'riceMgmt', 'manure',
  'irrigation', 'coldStorage', 'otherElec',
  'chemicals', 'transport', 'commute', 'packaging', 'waste',
  'biochar', 'trees',
  'p-coverCrop', 'p-noTill', 'p-compost', 'p-residue',
  'annualYieldKg', 'annualRevenueNT', 'productCategory',
  'langToggle', 'contrastToggle',
  'dashPrintBtn', 'dashTopBtn',
];

const REQUIRED_SECTIONS = [
  'sec-overview', 'sec-agent', 'sec-cashflow', 'sec-income',
  'sec-sources', 'sec-actions', 'sec-editor', 'sec-erp',
];

test('farm-dashboard.html is valid-ish HTML5', () => {
  assert.ok(/^<!doctype html>/i.test(html.slice(0, 200)), 'expected <!doctype html> at top');
  assert.ok(/<html[\s>]/.test(html), 'expected <html> tag');
  assert.ok(/<head>/.test(html), 'expected <head>');
  assert.ok(/<body[\s>]/.test(html), 'expected <body>');
});

test('every JS-required id exists in markup', () => {
  for (const id of REQUIRED_IDS) {
    const re = new RegExp(`id="${id}"`);
    assert.ok(re.test(html), `missing id="${id}"`);
  }
});

test('every required panel section is mounted', () => {
  for (const id of REQUIRED_SECTIONS) {
    const re = new RegExp(`id="${id}"`);
    assert.ok(re.test(html), `missing section id="${id}"`);
  }
});

test('meta head essentials present (cycles 22+23)', () => {
  assert.ok(/<meta name="viewport"[^>]*width=device-width/.test(html), 'missing viewport');
  assert.ok(/<meta name="theme-color"[^>]*prefers-color-scheme: light/.test(html), 'missing light theme-color');
  assert.ok(/<meta name="theme-color"[^>]*prefers-color-scheme: dark/.test(html), 'missing dark theme-color');
  assert.ok(/<link rel="manifest"/.test(html), 'missing manifest link');
  assert.ok(/<link rel="icon"/.test(html), 'missing favicon link');
});

test('noscript fallback present (cycle 26)', () => {
  assert.ok(/<noscript>/.test(html), 'missing <noscript> fallback');
  assert.ok(/JavaScript/.test(html), 'noscript should mention JavaScript');
});

test('emergency hotlines present in trust footer (cycle 27)', () => {
  assert.ok(/tel:1925/.test(html), 'missing 1925 hotline');
  assert.ok(/tel:1980/.test(html), 'missing 1980 hotline');
  assert.ok(/tel:1995/.test(html), 'missing 1995 hotline');
  assert.ok(/tel:113/.test(html), 'missing 113 hotline');
});

test('no consulting framing leak in user-visible places (cycle 5/19)', () => {
  // Should NOT find these specific framing strings — they were
  // explicitly swept. If anyone reintroduces them, fail loudly.
  assert.ok(!/data-zh="顧問建議"/.test(html), 'consulting framing leak: "顧問建議"');
  assert.ok(!/data-zh="問顧問"/.test(html), 'consulting framing leak: "問顧問"');
  assert.ok(!/編輯客戶資料/.test(html), 'consulting framing leak: 編輯客戶資料');
});

test('script-tag balance — no half-closed inline scripts', () => {
  const opens = (html.match(/<script[\s>]/g) || []).length;
  const closes = (html.match(/<\/script>/g) || []).length;
  assert.equal(opens, closes, `script tags unbalanced: ${opens} open vs ${closes} close`);
});

test('agentBody has aria-live for screen-reader chat announcements (cycle 16)', () => {
  assert.ok(/id="agentBody"[^>]*aria-live="polite"/.test(html), 'agentBody missing aria-live="polite"');
  assert.ok(/id="agentBody"[^>]*role="log"/.test(html), 'agentBody missing role="log"');
});

test('agent input has accessible label (cycle 16)', () => {
  assert.ok(/<label[^>]+for="agentQuestion"/.test(html), 'agent input missing <label for=agentQuestion>');
  assert.ok(/id="agentQuestion"[^>]*aria-label/.test(html), 'agent input missing aria-label fallback');
});

test('i18n parity — every element with data-zh has data-en (cycle 36)', () => {
  // Walk every <tag ... data-zh="..." ...> and check the same
  // element has a data-en attr. Catches the common "added a new
  // Chinese label but forgot the English fallback" drift.
  // Element-level regex (not perfect HTML parse but the dashboard
  // sticks to one-line attribute blocks for these labels).
  const tagRe = /<[a-zA-Z][^>]*\sdata-zh=(?:"[^"]*"|'[^']*')[^>]*>/g;
  let missing = 0;
  const examples = [];
  let m;
  while ((m = tagRe.exec(html)) !== null) {
    const tag = m[0];
    if (!/\sdata-en=(?:"[^"]*"|'[^']*')/.test(tag)) {
      missing++;
      if (examples.length < 3) examples.push(tag.slice(0, 120));
    }
  }
  assert.equal(missing, 0,
    `${missing} elements have data-zh without data-en. First few:\n  ${examples.join('\n  ')}`);
});
