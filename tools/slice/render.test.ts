// Tests for the slice generator's template renderer. The renderer is the only place EJS is
// configured, so every rule the conversion relies on is pinned here: raw output only, a
// misspelled model key throws, CRLF templates render LF, and templates resolve from the
// module's own folder regardless of the working directory.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderSource, renderTemplate, strict } from './render.ts';

test('renders model values raw, without HTML-escaping', () => {
  assert.equal(renderSource('Task<<%- m.type %>?> x => x && y', { type: 'User' }), 'Task<User?> x => x && y');
});

test('rejects the escaping <%= tag before it can mangle generated code', () => {
  assert.throws(() => renderSource('<%= m.type %>', { type: 'User' }, 'bad.cs.ejs'), /bad\.cs\.ejs: use <%-/);
});

test('a misspelled model key throws naming the key', () => {
  assert.throws(() => renderSource('<%- m.pascl %>', { pascal: 'Order' }), /m\.pascl/);
});

test('a nested misspelling throws with the full path', () => {
  assert.throws(
    () => renderSource('<%_ for (const f of m.fields) { _%><%- f.nmae %><%_ } _%>', { fields: [{ name: 'a' }] }),
    /nmae/,
  );
});

test('a key that exists with a null value does not throw', () => {
  assert.equal(renderSource('<%_ if (m.lookup) { _%>yes<%_ } _%>no', { lookup: null }), 'no');
});

test('control lines written with <%_ _%> leave no blank line behind', () => {
  const source = 'a\n<%_ for (const x of m.xs) { _%>\n- <%- x %>\n<%_ } _%>\nb\n';
  assert.equal(renderSource(source, { xs: ['1', '2'] }), 'a\n- 1\n- 2\nb\n');
});

test('a template saved with CRLF renders LF', () => {
  assert.equal(renderSource('a\r\n<%- m.x %>\r\n', { x: 'b' }), 'a\nb\n');
});

test('strict passes existing keys through, including array methods and length', () => {
  const m = strict({ xs: [1, 2] });
  assert.equal(m.xs.length, 2);
  assert.deepEqual(m.xs.map((x) => x * 2), [2, 4]);
});

test('renderTemplate resolves from the module folder, not the working directory', () => {
  const cwd = process.cwd();
  try {
    process.chdir(mkdtempSync(join(tmpdir(), 'render-')));
    assert.equal(renderTemplate('_selftest.txt.ejs', { word: 'ok' }), 'self-test ok\n');
  } finally {
    process.chdir(cwd);
  }
});

test('renderTemplate names the missing template', () => {
  assert.throws(() => renderTemplate('nope/missing.cs.ejs', {}), /nope\/missing\.cs\.ejs/);
});
