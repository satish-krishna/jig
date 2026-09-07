import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deriveNames, renameContent, renamePath, stripTemplateBlocks } from './rename.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('deriveNames splits a multi-word PascalCase name into every form', () => {
  const n = deriveNames('AcmePortal');
  assert.equal(n.pascal, 'AcmePortal');
  assert.equal(n.kebab, 'acme-portal');
  assert.equal(n.snake, 'acme_portal');
  assert.equal(n.lower, 'acmeportal');
  assert.equal(n.bundleId, 'com.acmeportal.app');
});

test('deriveNames handles a single word', () => {
  const n = deriveNames('acme');
  assert.deepEqual(
    [n.pascal, n.kebab, n.snake, n.bundleId],
    ['Acme', 'acme', 'acme', 'com.acme.app'],
  );
});

test('deriveNames accepts an explicit bundle id', () => {
  assert.equal(deriveNames('AcmePortal', 'io.acme.desktop').bundleId, 'io.acme.desktop');
});

test('deriveNames rejects a dotted app name instead of silently disabling the architecture analyzer', () => {
  assert.throws(() => deriveNames('Acme.Portal'), /must not contain a dot/);
});

test('renameContent maps .NET namespaces via Pascal', () => {
  const n = deriveNames('AcmePortal');
  assert.equal(renameContent('namespace Jig.Api;', n), 'namespace AcmePortal.Api;');
});

test('renameContent rewrites the Rust lib to snake_case before the generic pass', () => {
  const n = deriveNames('AcmePortal');
  // jig_lib -> acme_portal_lib (snake), bare jig -> acme-portal (kebab), in one string
  assert.equal(renameContent('jig_lib::run() // jig', n), 'acme_portal_lib::run() // acme-portal');
});

test('renameContent rewrites the bundle id without hyphens', () => {
  const n = deriveNames('AcmePortal');
  assert.equal(renameContent('"identifier": "com.jig.app"', n), '"identifier": "com.acmeportal.app"');
});

test('renameContent rewrites the dist path and Cargo package name to kebab', () => {
  const n = deriveNames('AcmePortal');
  assert.equal(renameContent('../../../frontend/dist/jig/browser', n), '../../../frontend/dist/acme-portal/browser');
  assert.equal(renameContent('name = "jig"', n), 'name = "acme-portal"');
});

test('renameContent rewrites the ESLint plugin import, registration, and rule prefix consistently', () => {
  // The `jig` plugin's import binding and its `plugins: { jig }` shorthand key
  // are both JS identifiers, not strings, so a naive kebab-case rewrite (valid
  // for the quoted rule prefix) would leave `plugins: { acme-portal }` and
  // `import acme-portal from ...` — both syntax errors. The identifier must
  // rewrite to a valid JS name while the rule prefix stays kebab-case, and the
  // plugin registration key must still match that prefix.
  const n = deriveNames('AcmePortal');
  assert.equal(
    renameContent("import jig from '../tools/lint/index.ts';", n),
    "import acmePortal from '../tools/lint/index.ts';",
  );
  assert.equal(renameContent('plugins: { jig },', n), "plugins: { 'acme-portal': acmePortal },");
  assert.equal(
    renameContent("'jig/no-literal-spacing': 'error',", n),
    "'acme-portal/no-literal-spacing': 'error',",
  );
});

test('frontend/eslint.config.mjs still contains the exact literals renameContent depends on', () => {
  // renameContent's ESLint-plugin rewrite (see the tests above) matches the
  // literal strings "import jig from" and "plugins: { jig }". Nothing else
  // ties those strings to the real config file, so a reformat of
  // eslint.config.mjs — spreading the import or the plugin registration
  // across lines, or adding a second plugin to the same object — would slip
  // past every renameContent unit test above while breaking every cloned app:
  // rename.ts would no longer find the identifier to rewrite, and a clone
  // would ship with `plugins: { jig }` still in place alongside the new
  // plugin's kebab-case key, which is a syntax error. tools/init/init.mjs
  // runs verify after `rm .git`, so that failure reaches a user with no
  // history to recover. This test reads the real file so a config reformat
  // fails here, in the suite that is supposed to catch it.
  const config = readFileSync(join(ROOT, 'frontend', 'eslint.config.mjs'), 'utf8');
  assert.ok(
    config.includes('import jig from'),
    'renameContent rewrites this exact import binding; frontend/eslint.config.mjs no longer contains it',
  );
  assert.ok(
    config.includes('plugins: { jig }'),
    'renameContent rewrites this exact plugin-registration shorthand; frontend/eslint.config.mjs no longer contains it',
  );
});

test('stripTemplateBlocks removes marked template-only prose, keeps the rest', () => {
  const text = 'keep me\n<!-- template:start -->\ntemplate only\n<!-- template:end -->\nkeep me too\n';
  assert.equal(stripTemplateBlocks(text), 'keep me\nkeep me too\n');
});

test('renamePath maps .NET project directories', () => {
  const n = deriveNames('AcmePortal');
  assert.equal(
    renamePath('services/api/src/Jig.Api/Jig.Api.csproj', n),
    'services/api/src/AcmePortal.Api/AcmePortal.Api.csproj',
  );
});

test('renamePath rewrites the lowercase design-system skill folder via kebab', () => {
  const n = deriveNames('AcmePortal');
  assert.equal(
    renamePath('.claude/skills/jig-design/components/core/Button.jsx', n),
    '.claude/skills/acme-portal-design/components/core/Button.jsx',
  );
});
