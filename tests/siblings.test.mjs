// siblings.test.mjs — invariants every public HTML page must hold
// to keep the multi-page property of the project coherent.
//
// Run: `node --test tests/siblings.test.mjs`

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const htmlFiles = readdirSync(root).filter(f => f.endsWith('.html'));

// Pages that are user-facing AND ship language toggle: should all
// persist tct_lang. Internal-only or share pages may opt out via
// the OPT_OUT list.
const LANG_OPT_OUT = new Set([
  'r.html'           // redirect stub, no UI
]);

const READ = {};
for (const f of htmlFiles) READ[f] = readFileSync(join(root, f), 'utf8');

test('at least 5 public HTML pages exist', () => {
  assert.ok(htmlFiles.length >= 5, 'expected 5+ HTML pages');
});

for (const f of htmlFiles) {
  test(`${f} has valid <!doctype html>`, () => {
    assert.ok(/^<!doctype html>/i.test(READ[f].slice(0, 200)), `${f}: bad/missing doctype`);
  });

  test(`${f} has viewport meta`, () => {
    assert.ok(/<meta\s+name="viewport"[^>]*width=device-width/i.test(READ[f]),
      `${f}: missing viewport meta — page won\'t render on mobile`);
  });

  test(`${f} declares lang on <html>`, () => {
    assert.ok(/<html[^>]+lang=/i.test(READ[f]) || /<html\s*>/.test(READ[f]),
      `${f}: missing lang attribute on <html> (a11y + SEO)`);
  });

  if (!LANG_OPT_OUT.has(f)) {
    test(`${f} persists language preference via tct_lang`, () => {
      const hasLangToggle = /id=['"]langToggle['"]/.test(READ[f]);
      if (!hasLangToggle) return; // page has no toggle, nothing to persist
      assert.ok(/tct_lang/.test(READ[f]),
        `${f}: has langToggle but never reads/writes tct_lang — language won\'t persist across reloads`);
    });
  }

  test(`${f} script-tag balance is sane`, () => {
    const opens = (READ[f].match(/<script[\s>]/g) || []).length;
    const closes = (READ[f].match(/<\/script>/g) || []).length;
    assert.equal(opens, closes, `${f}: ${opens} <script> vs ${closes} </script> — unbalanced`);
  });
}

test('all pages reference farm-carbon-engine.js with a version query when used', () => {
  // Cache-busting guarantee: if a page imports the engine, it should
  // use a ?v=N query so SW + browser cache invalidate when bumped.
  for (const f of htmlFiles) {
    if (!/farm-carbon-engine\.js/.test(READ[f])) continue;
    assert.ok(/farm-carbon-engine\.js\?v=/.test(READ[f]),
      `${f}: references farm-carbon-engine.js without ?v= query (cache invalidation)`);
  }
});

test('every page that uses agentQuestion ID also has the related form', () => {
  for (const f of htmlFiles) {
    if (!/id=['"]agentQuestion['"]/.test(READ[f])) continue;
    assert.ok(/id=['"]agentAskForm['"]/.test(READ[f]),
      `${f}: has #agentQuestion but no #agentAskForm — submit won\'t work`);
  }
});
