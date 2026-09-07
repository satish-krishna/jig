import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-legacy-control-flow.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-legacy-control-flow', () => {
  ruleTester.run('no-legacy-control-flow', rule, {
    valid: [
      { code: `@if (x) { <p>y</p> }`, filename: 'x.html' },
    ],
    invalid: [
      {
        code: `<p *ngIf="x">y</p>`,
        filename: 'x.html',
        errors: [{ messageId: 'legacyControlFlow' }],
      },
      {
        code: `<p *ngFor="let i of xs">{{i}}</p>`,
        filename: 'x.html',
        errors: [{ messageId: 'legacyControlFlow' }],
      },
    ],
  });
});
