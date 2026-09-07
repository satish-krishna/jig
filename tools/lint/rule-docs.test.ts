import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import plugin from './index.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const RULES_DIR = join(ROOT, 'tools', 'lint', 'rules');
const DOCS_DIR = join(ROOT, 'docs', 'architecture', 'rules');

const ruleNames = () =>
  readdirSync(RULES_DIR)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => f.replace(/\.ts$/, ''));

test('every rule file is registered in the plugin', () => {
  for (const name of ruleNames()) {
    assert.ok(plugin.rules[name], `${name}.ts exists but the plugin does not export it`);
  }
});

test('every rule has a document', () => {
  // ESLint never prints meta.docs.url — a lint message object carries no URL
  // field at all. The hooks append the pointer deliberately, so the document has
  // to exist or the pointer is a lie.
  for (const name of ruleNames()) {
    assert.ok(existsSync(join(DOCS_DIR, `${name}.md`)), `docs/architecture/rules/${name}.md missing`);
  }
});

test('every rule declares its doc url', () => {
  for (const [name, rule] of Object.entries(plugin.rules)) {
    assert.equal(
      rule.meta?.docs?.url,
      `docs/architecture/rules/${name}.md`,
      `${name} must declare meta.docs.url as a repo-relative path`,
    );
  }
});

test('every rule declares at least one message', () => {
  for (const [name, rule] of Object.entries(plugin.rules)) {
    assert.ok(Object.keys(rule.meta?.messages ?? {}).length > 0, `${name} declares no messages`);
  }
});

test('every rule is exercised through RuleTester, not only through its predicate', () => {
  // The gap this closes, found by the final whole-branch review: no-literal-spacing
  // was the one rule of 26 whose test file had no RuleTester. All seven of its tests
  // called the exported predicate directly, so `create()` was never run — replace the
  // rule body with `return {}` and the entire suite stayed green while `npm run lint`
  // reported zero on a template carrying three real violations.
  //
  // That is this repo's own thesis failing inside the branch that argues it: a check
  // that cannot fail is worse than no check, because it reports. A predicate test
  // proves the predicate; only a RuleTester case proves the rule is wired to it, which
  // is the part that can silently come loose.
  //
  // Testing the predicate as well is good and several rules rightly do both. This
  // asserts the RuleTester half exists, not that it is the only half.
  for (const name of ruleNames()) {
    const testFile = join(RULES_DIR, `${name}.test.ts`);
    assert.ok(existsSync(testFile), `${name}.test.ts missing`);

    assert.match(
      readFileSync(testFile, 'utf8'),
      /RuleTester/,
      `${name}.test.ts never constructs a RuleTester, so nothing runs the rule's create() — ` +
        'gut the rule body and this suite would still pass',
    );
  }
});
