import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, existsSync } from 'node:fs';
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
