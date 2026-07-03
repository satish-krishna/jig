import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveNames, renameContent, renamePath, stripTemplateBlocks } from './rename.ts';

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
