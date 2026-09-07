import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAnnotations, languageFor } from './parse.ts';

test('extracts a TSDoc capability block and its symbol', () => {
  const src = `/**
 * Folds HTTP and IPC failures into one AppError at a single seam.
 * @capability transport.normalizing
 * @intent One place to shape errors; nothing above branches on wire.
 * @reuse Wrap the selected Transport at bootstrap.
 */
export class NormalizingTransport {}
`;
  const [entry, ...rest] = parseAnnotations(src, 'frontend/src/app/transport/normalizing.ts');
  assert.equal(rest.length, 0);
  assert.equal(entry.capability, 'transport.normalizing');
  assert.equal(entry.intent, 'One place to shape errors; nothing above branches on wire.');
  assert.equal(entry.reuse, 'Wrap the selected Transport at bootstrap.');
  assert.equal(entry.language, 'typescript');
  assert.equal(entry.symbol, 'NormalizingTransport');
});

test('extracts a rustdoc capability block', () => {
  const src = `/// Native system-tray lifecycle for the desktop shell.
/// @capability shell.tray
/// @intent Own tray creation so features request state, not build it.
/// @reuse Call via TrayService; the web build never sees this.
pub struct TrayService;
`;
  const [entry] = parseAnnotations(src, 'apps/desktop/src-tauri/src/tray.rs');
  assert.equal(entry.capability, 'shell.tray');
  assert.equal(entry.language, 'rust');
  assert.equal(entry.symbol, 'TrayService');
});

test('extracts a C# XML doc capability block', () => {
  const src = `/// <summary>Uniform success/failure envelope returned by every endpoint.</summary>
/// <capability>api.result-envelope</capability>
/// <intent>Expected failures travel as data, not exceptions.</intent>
/// <reuse>Return Result&lt;T&gt; from handlers; do not throw for validation.</reuse>
public sealed class Result<T> {}
`;
  const [entry] = parseAnnotations(src, 'services/api/src/Jig.Domain/Result.cs');
  assert.equal(entry.capability, 'api.result-envelope');
  assert.equal(entry.intent, 'Expected failures travel as data, not exceptions.');
  assert.equal(entry.reuse, 'Return Result<T> from handlers; do not throw for validation.');
  assert.equal(entry.language, 'csharp');
  assert.equal(entry.symbol, 'Result');
});

test('returns nothing for source without a capability tag', () => {
  assert.deepEqual(parseAnnotations('export const x = 1;\n', 'x.ts'), []);
});

test('finds multiple capabilities in one file', () => {
  const src = `/**
 * @capability a.one
 * @intent i1
 * @reuse r1
 */
export function one() {}

/**
 * @capability a.two
 * @intent i2
 * @reuse r2
 */
export function two() {}
`;
  const entries = parseAnnotations(src, 'a.ts');
  assert.equal(entries.length, 2);
  assert.deepEqual(entries.map((e) => e.capability), ['a.one', 'a.two']);
  assert.deepEqual(entries.map((e) => e.symbol), ['one', 'two']);
});

test('languageFor maps extensions and rejects the unknown', () => {
  assert.equal(languageFor('a.ts'), 'typescript');
  assert.equal(languageFor('a.rs'), 'rust');
  assert.equal(languageFor('a.cs'), 'csharp');
  assert.equal(languageFor('a.md'), null);
});

test('a wrapped @intent or @reuse keeps its continuation lines', () => {
  // The generator used to read only the line carrying the tag, so a wrapped
  // annotation lost everything after it — silently, into a document CLAUDE.md
  // tells every agent to trust. It shipped `- **Intent:** ... a predicate poll
  // that` in CATALOG.md, stopping mid-clause, and was caught by reading the
  // diff rather than by any gate. Continuation lines join with one space so the
  // source comment's wrapping does not leak into the rendered output.
  const src = `/**
 * @capability testing.wrapped
 * @intent Replace a fixed-duration sleep with a predicate poll that
 *   fails loudly, by name, on a genuine timeout.
 * @reuse Any spec waiting out an async overlay: pass a predicate
 *   and a tick.
 */
export function waitUntil() {}
`;
  const [entry] = parseAnnotations(src, 'tools/x.ts');

  assert.equal(
    entry.intent,
    'Replace a fixed-duration sleep with a predicate poll that fails loudly, by name, on a genuine timeout.',
  );
  assert.equal(entry.reuse, 'Any spec waiting out an async overlay: pass a predicate and a tick.');
});

test('a continuation stops at the next tag, never swallowing it', () => {
  // The failure mode of a naive fix: consume until the block ends, and @reuse
  // gets absorbed into @intent, which loses a field instead of truncating one.
  const src = `/**
 * @capability testing.adjacent
 * @intent First line only.
 * @reuse Second field, must survive.
 */
export function x() {}
`;
  const [entry] = parseAnnotations(src, 'tools/x.ts');

  assert.equal(entry.intent, 'First line only.');
  assert.equal(entry.reuse, 'Second field, must survive.');
});
