import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-ng-class-style.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-ng-class-style', () => {
  ruleTester.run('no-ng-class-style', rule, {
    valid: [
      { code: `<div [class.active]="x">y</div>`, filename: 'x.html' },
      { code: `<div class="grid">y</div>`, filename: 'x.html' },
    ],
    invalid: [
      {
        code: `<div [ngClass]="x">y</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'ngClassStyle' }],
      },
      {
        code: `<div [ngStyle]="x">y</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'ngClassStyle' }],
      },
      {
        code: `<div ngClass>y</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'ngClassStyle' }],
      },
    ],
  });
});
