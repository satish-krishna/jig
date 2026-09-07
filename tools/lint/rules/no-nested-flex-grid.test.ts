import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-nested-flex-grid.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-nested-flex-grid', () => {
  ruleTester.run('no-nested-flex-grid', rule, {
    valid: [
      // A flex column containing flex rows is the opposite direction — not flagged.
      {
        code: `<div class="flex flex-col"><div class="flex"></div><div class="flex"></div></div>`,
        filename: 'x.html',
      },
      // A flex row with only one column child is not "nested" enough to be a grid.
      {
        code: `<div class="flex"><div class="flex flex-col"></div><div class="not-a-column"></div></div>`,
        filename: 'x.html',
      },
    ],
    invalid: [
      {
        code: `<div class="flex"><div class="flex flex-col"></div><div class="flex flex-col"></div></div>`,
        filename: 'x.html',
        errors: [{ messageId: 'nestedFlexGrid' }],
      },
    ],
  });
});
