import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-orphan-ng-submit.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-orphan-ng-submit', () => {
  ruleTester.run('no-orphan-ng-submit', rule, {
    valid: [
      // Paired with [formGroup]: the dynamic renderer's own reactive form,
      // legitimate per docs/architecture/forms.md (forms/schema-form.ts).
      { code: `<form [formGroup]="form()" (ngSubmit)="onSubmit()">y</form>`, filename: 'x.html' },
      // Signal-forms submits through the native (submit) event, not ngSubmit.
      { code: `<form (submit)="onSubmit($event)">y</form>`, filename: 'x.html' },
    ],
    invalid: [
      {
        code: `<form (ngSubmit)="onSubmit()">y</form>`,
        filename: 'x.html',
        errors: [{ messageId: 'orphanNgSubmit' }],
      },
      // "On any element": ngSubmit is not restricted to <form> tags either.
      {
        code: `<div (ngSubmit)="onSubmit()">y</div>`,
        filename: 'x.html',
        errors: [{ messageId: 'orphanNgSubmit' }],
      },
    ],
  });
});
