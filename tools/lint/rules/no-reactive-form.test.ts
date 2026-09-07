import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-reactive-form.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-reactive-form', () => {
  ruleTester.run('no-reactive-form', rule, {
    valid: [
      // Presentational tier is out of scope: forms/schema-form.ts is the
      // dynamic renderer and is reactive by design (docs/architecture/forms.md),
      // and the showcase demos reactive forms against spartan controls deliberately.
      {
        code: `@Component({ imports: [ReactiveFormsModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/forms/schema-form.ts',
      },
      {
        code: `@Component({ imports: [ReactiveFormsModule] }) export class X { f = new FormGroup({}); }`,
        filename: '/repo/frontend/src/app/showcase/pages/input.page.ts',
      },
      // signal-forms is the container-tier pattern and stays untouched.
      {
        code: `@Component({}) export class X { readonly form = form(this.model, validateStandardSchema); }`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
    ],
    invalid: [
      {
        code: `@Component({ imports: [ReactiveFormsModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'reactiveForm' }],
      },
      {
        code: `@Component({ imports: [ReactiveFormsModule.withConfig({})] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'reactiveForm' }],
      },
      {
        code: `@Component({}) export class X { f = new FormGroup({}); }`,
        filename: '/repo/frontend/src/app/shell/x.ts',
        errors: [{ messageId: 'reactiveForm' }],
      },
      // Both triggers fire in the same component: still a single defect, one report.
      {
        code: `@Component({ imports: [ReactiveFormsModule] }) export class X { a = new FormGroup({}); b = new FormGroup({}); }`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'reactiveForm' }],
      },
    ],
  });
});
