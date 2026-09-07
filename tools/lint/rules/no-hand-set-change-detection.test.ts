import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-hand-set-change-detection.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-hand-set-change-detection', () => {
  ruleTester.run('no-hand-set-change-detection', rule, {
    valid: [
      { code: `@Component({ selector: 'app-x' }) export class X {}` },
      { code: `@Directive({ changeDetection: ChangeDetectionStrategy.OnPush }) export class X {}` },
      { code: `const o = { changeDetection: ChangeDetectionStrategy.OnPush };` },
    ],
    invalid: [
      {
        code: `@Component({ selector: 'app-x', changeDetection: ChangeDetectionStrategy.OnPush, template: '' }) export class X {}`,
        errors: [{ messageId: 'handSetChangeDetection' }],
      },
      {
        code: `@Component({ changeDetection: ChangeDetectionStrategy.OnPush }) export class X {}`,
        errors: [{ messageId: 'handSetChangeDetection' }],
      },
    ],
  });
});
