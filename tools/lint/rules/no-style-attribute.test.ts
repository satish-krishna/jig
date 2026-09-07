import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-style-attribute.ts';

const ruleTester = new RuleTester({ languageOptions: { parser: angular.templateParser } });

test('no-style-attribute', () => {
  ruleTester.run('no-style-attribute', rule, {
    valid: [
      { code: `<div [style.width]="w">x</div>`, filename: 'x.html' },
      { code: `<div class="grid">x</div>`, filename: 'x.html' },
    ],
    invalid: [
      {
        code: `<div style="display: contents">x</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'styleAttribute' }],
      },
    ],
  });
});
