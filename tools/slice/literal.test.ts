// Tests for the emitted-literal escapers. These are the highest-leverage four lines in the
// generator: an escaping defect does not fail here, it ships a generated file that is not
// valid source, in every clone, for every slice whose author wrote an apostrophe.

import test from 'node:test';
import assert from 'node:assert/strict';
import { interpolatedString, tsString } from './literal.ts';

// Written as a code point so this file carries no backslash run of its own to misread.
const BACKSLASH = String.fromCharCode(92);

test('tsString leaves ordinary copy byte-identical to a hand-written literal', () => {
  assert.equal(tsString('Reference'), "'Reference'");
  assert.equal(tsString('Ada Lovelace'), "'Ada Lovelace'");
});

test('tsString escapes the apostrophe that would close the literal early', () => {
  assert.equal(tsString("Owner's name"), "'Owner\\'s name'");
});

test('tsString escapes a backslash before it can start an escape sequence', () => {
  assert.equal(tsString(BACKSLASH + 'n'), "'\\\\n'");
});

test('the escaped literal is what TypeScript reads back as the original', () => {
  for (const value of ["Owner's name", BACKSLASH + 'n', "it" + BACKSLASH + "'s", 'plain']) {
    assert.equal(eval(tsString(value)), value);
  }
});

test('interpolatedString doubles braces and escapes quotes for both interpolating languages', () => {
  assert.equal(interpolatedString('Total'), 'Total');
  assert.equal(interpolatedString('a {b} c'), 'a {{b}} c');
  assert.equal(interpolatedString('say "hi"'), 'say \\"hi\\"');
  assert.equal(interpolatedString(BACKSLASH), BACKSLASH + BACKSLASH);
});
