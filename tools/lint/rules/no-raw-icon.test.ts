import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-raw-icon.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-raw-icon', () => {
  ruleTester.run('no-raw-icon', rule, {
    valid: [
      { code: `<ng-icon name="lucideUsers" />`, filename: 'x.html' },
    ],
    invalid: [
      {
        code: `<svg><path d="M0 0"/></svg>`,
        filename: 'x.html',
        // Exactly one report at the root svg, not one per :svg:path descendant.
        errors: [{ messageId: 'rawIcon' }],
      },
    ],
  });
});
