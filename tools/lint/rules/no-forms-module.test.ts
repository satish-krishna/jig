import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-forms-module.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-forms-module', () => {
  ruleTester.run('no-forms-module', rule, {
    valid: [
      // No FormsModule at all.
      {
        code: `@Component({ imports: [ReactiveFormsModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
      // Presentational tier is out of scope: the showcase demos template-driven
      // controls deliberately, and forms/schema-form.ts is reactive by design.
      {
        code: `@Component({ imports: [FormsModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/showcase/pages/input.page.ts',
      },
    ],
    invalid: [
      {
        code: `@Component({ imports: [FormsModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'formsModule' }],
      },
      // Same member-call shape the icon rule missed. All three banned-module rules
      // share componentImports, so all three share its blind spots.
      {
        code: `@Component({ imports: [FormsModule.withConfig({})] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'formsModule' }],
      },
      {
        code: `@Component({ imports: [FormsModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/shell/x.ts',
        errors: [{ messageId: 'formsModule' }],
      },
    ],
  });
});
