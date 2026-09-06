import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isLiteralSpacingClass } from './no-literal-spacing.mjs';

test('flags a numeric spacing utility', () => {
  for (const cls of ['gap-2', 'p-6', 'px-4', 'mt-1.5', 'gap-x-4', 'mb-0.5']) {
    assert.equal(isLiteralSpacingClass(cls), true, `${cls} should be flagged`);
  }
});

test('accepts a named step', () => {
  for (const cls of ['gap-m', 'p-xl', 'px-s', 'mt-xs', 'gap-y-l', 'mb-2xl']) {
    assert.equal(isLiteralSpacingClass(cls), false, `${cls} should pass`);
  }
});

test('strips responsive and state prefixes before deciding', () => {
  assert.equal(isLiteralSpacingClass('sm:gap-2'), true);
  assert.equal(isLiteralSpacingClass('hover:p-4'), true);
  assert.equal(isLiteralSpacingClass('dark:sm:mt-2'), true);
  assert.equal(isLiteralSpacingClass('sm:gap-m'), false);
});

test('flags an arbitrary spacing value', () => {
  assert.equal(isLiteralSpacingClass('p-[13px]'), true);
  assert.equal(isLiteralSpacingClass('gap-[0.4rem]'), true);
});

test('flags a negative margin literal, and accepts a negative margin step', () => {
  // libs/ui uses -mx-1, -mx-4, and -mb-4 today (spartan's half-step rhythm),
  // which is exactly the idiom an author copying that pattern into app code
  // reaches for. The rule must catch it there too.
  for (const cls of ['-mt-2', '-mx-4', '-mb-0.5']) {
    assert.equal(isLiteralSpacingClass(cls), true, `${cls} should be flagged`);
  }
  for (const cls of ['-mt-s', '-mx-xl']) {
    assert.equal(isLiteralSpacingClass(cls), false, `${cls} should pass`);
  }
});

test('leaves zero, px and auto alone', () => {
  // Zero is the absence of spacing, not a step; mx-auto is centring, not spacing;
  // gap-px is the 1px hairline design.md declares a primitive.
  for (const cls of ['gap-0', 'p-0', 'mx-auto', 'gap-px', 'mt-auto']) {
    assert.equal(isLiteralSpacingClass(cls), false, `${cls} should pass`);
  }
});

test('does not touch classes that merely start with a spacing prefix', () => {
  // "px" is a prefix of "px-4" but "pointer-events-none" is not a padding
  // utility, and "max-w-2" is not a margin one.
  for (const cls of ['pointer-events-none', 'max-w-2', 'grid-cols-3', 'text-sm', 'ps-0']) {
    assert.equal(isLiteralSpacingClass(cls), false, `${cls} should pass`);
  }
});
