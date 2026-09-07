import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-space-utility.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-space-utility', () => {
  ruleTester.run('no-space-utility', rule, {
    valid: [
      { code: `<div class="grid gap-m"></div>`, filename: 'x.html' },
    ],
    invalid: [
      { code: `<div class="space-y-4"></div>`, filename: 'x.html', errors: [{ messageId: 'spaceUtility' }] },
      { code: `<div class="sm:space-x-2"></div>`, filename: 'x.html', errors: [{ messageId: 'spaceUtility' }] },
    ],
  });
});
