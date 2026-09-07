import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-explicit-standalone.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-explicit-standalone', () => {
  ruleTester.run('no-explicit-standalone', rule, {
    valid: [
      { code: `@Component({ selector: 'app-x', template: '' }) export class X {}` },
      { code: `@Directive({ standalone: true }) export class X {}` },
      { code: `const o = { standalone: true };` },
    ],
    invalid: [
      {
        code: `@Component({ selector: 'app-x', standalone: true, template: '' }) export class X {}`,
        errors: [{ messageId: 'explicitStandalone' }],
      },
      {
        // The decidable fact is the property's presence, not its value.
        code: `@Component({ standalone: false }) export class X {}`,
        errors: [{ messageId: 'explicitStandalone' }],
      },
    ],
  });
});
