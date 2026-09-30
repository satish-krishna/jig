// The `users` slice is the generator's golden output: generating it from its own spec must
// reproduce every committed file byte for byte. This is `slice --check` from ADR 0015. Without
// it the emitters and the exemplar drift apart silently — a lint rule lands, the exemplar is
// updated to satisfy it, the emitters are not, and every slice generated afterwards fails the
// rule while the gate stays green.
//
// Template-only (listed in TEMPLATE_ONLY, so init deletes it): in an app cloned from the
// template, `users` belongs to the developer, who is expected to change it or delete it.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec } from './spec.ts';
import { plan } from './slice.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('generating the users slice from its spec reproduces the committed exemplar exactly', () => {
  const spec = loadSpec(join(ROOT, 'examples', 'slices', 'users.slice.json'));
  // The template always ships both clients, and init deletes this file before any thin cut.
  const drifted = plan(spec, 'Jig', true).writes
    .filter((w) => readFileSync(join(ROOT, w.path), 'utf8') !== w.text)
    .map((w) => w.path);
  assert.deepEqual(
    drifted,
    [],
    'These exemplar files no longer match what the generator emits. Change the emitter in ' +
      'tools/slice/ and regenerate users with `npm run slice -- --spec examples/slices/users.slice.json --force`, ' +
      'or the next generated slice will not match the exemplar either.',
  );
});
