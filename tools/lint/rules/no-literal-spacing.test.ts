import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule, { isLiteralSpacingClass } from './no-literal-spacing.ts';

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

// --- the rule itself, not just its predicate ---------------------------------
//
// Every test above exercises `isLiteralSpacingClass` directly. None of them ran
// `create()`, so this was the one rule of 26 that survived being hollowed out:
// with the body replaced by `return {}` the whole suite stayed green while
// `npm run lint` reported zero on a template carrying three real violations.
// Found by the final whole-branch review. A predicate test proves the predicate;
// only a RuleTester case proves the rule is wired to it.
const ruleTester = new RuleTester({ languageOptions: { parser: angular.templateParser } });

test('no-literal-spacing', () => {
  ruleTester.run('no-literal-spacing', rule, {
    valid: [
      { code: `<div class="gap-m p-l">x</div>`, filename: 'x.html' },
      { code: `<div class="flex items-center">x</div>`, filename: 'x.html' },
      { code: `<div class="gap-0 p-px m-auto">x</div>`, filename: 'x.html' },
      // A class that merely starts with a spacing prefix is not a spacing utility.
      { code: `<div class="grid place-items-center">x</div>`, filename: 'x.html' },
    ],
    invalid: [
      {
        code: `<div class="gap-4">x</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'literalSpacing' }],
      },
      {
        code: `<div class="p-[13px]">x</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'literalSpacing' }],
      },
      {
        code: `<div class="-mt-3">x</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'literalSpacing' }],
      },
      // Several literals in one attribute report once each, not once per attribute.
      {
        code: `<div class="gap-4 p-2 mt-6">x</div>`,
        filename: 'x.html',
        errors: [
          { messageId: 'literalSpacing' },
          { messageId: 'literalSpacing' },
          { messageId: 'literalSpacing' },
        ],
      },
    ],
  });
});
