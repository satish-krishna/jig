import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-ng-model.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-ng-model', () => {
  ruleTester.run('no-ng-model', rule, {
    valid: [
      { code: `<input [formField]="form.name" />`, filename: 'x.html' },
      { code: `<input [formControlName]="'name'" />`, filename: 'x.html' },
    ],
    invalid: [
      { code: `<input [(ngModel)]="name" />`, filename: 'x.html', errors: [{ messageId: 'ngModel' }] },
      { code: `<input [ngModel]="name" />`, filename: 'x.html', errors: [{ messageId: 'ngModel' }] },
      { code: `<input ngModel />`, filename: 'x.html', errors: [{ messageId: 'ngModel' }] },
    ],
  });
});
