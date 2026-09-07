import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import plugin from './index.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const CONFIG = readFileSync(join(ROOT, 'frontend', 'eslint.config.mjs'), 'utf8');

test('every registered rule is enabled at error', () => {
  // This is why the rule FILES need no write guard: gutting one turns its own
  // RuleTester test red. Deleting a LINE from the config is silent, and this is
  // what makes it loud.
  for (const name of Object.keys(plugin.rules)) {
    assert.ok(
      CONFIG.includes(`'jig/${name}': 'error'`),
      `jig/${name} is not enabled at error in frontend/eslint.config.mjs`,
    );
  }
});

test('inline suppression is switched off wherever rules run', () => {
  const blocks = CONFIG.match(/noInlineConfig:\s*true/g) ?? [];

  assert.ok(blocks.length >= 2, 'noInlineConfig must be set on both the ts and html blocks');
});

test('the generated ui library is ignored', () => {
  assert.ok(CONFIG.includes("'frontend/libs/**'"), 'frontend/libs/** must stay ignored — it is generated');
});

test('the ignore list has not been widened', () => {
  // A rule nobody runs is not a rule. Widening ignores is the quietest way to
  // switch this gate off, so the allowed set is pinned.
  //
  // Entries are root-relative ("frontend/dist/**", not "dist/**"): ESLint 9
  // pins basePath to the CLI's cwd whenever --config is passed explicitly, not
  // to the config file's own directory, so a config-relative ignore silently
  // fails to exclude generated/vendored code. That fix predates this test —
  // see the eslint.config.mjs header comment — so the allowed set is pinned
  // to what actually works, not to what a bare-path assumption would expect.
  const allowed = [
    'frontend/dist/**',
    'frontend/.angular/**',
    'frontend/node_modules/**',
    'frontend/coverage/**',
    'frontend/libs/**',
  ];
  const found = [...CONFIG.matchAll(/ignores:\s*\[([^\]]+)\]/g)]
    .flatMap((m) => [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]));

  for (const entry of found) {
    assert.ok(allowed.includes(entry), `unexpected ignore entry: ${entry}`);
  }
});
