import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-restated-validator.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-restated-validator', () => {
  ruleTester.run('no-restated-validator', rule, {
    valid: [
      // The same call, but not inside a @Component class.
      {
        code: `import { required } from '@angular/forms/signals'; function f(p) { return required(p.name); }`,
      },
      // A local helper of the same name is not the signal-forms import.
      {
        code: `function required(p) { return p; } @Component({}) export class X { f() { return required(this.p); } }`,
      },
      // Imported from somewhere else entirely.
      {
        code: `import { required } from './my-validators.ts'; @Component({}) export class X { f() { return required(this.p); } }`,
      },
    ],
    invalid: [
      {
        code: `import { required } from '@angular/forms/signals'; @Component({}) export class X { f() { return required(this.p); } }`,
        errors: [{ messageId: 'restatedValidator' }],
      },
      {
        code: `import { minLength } from '@angular/forms/signals'; @Component({}) export class X { f() { return minLength(this.p, 1); } }`,
        errors: [{ messageId: 'restatedValidator' }],
      },
    ],
  });
});
