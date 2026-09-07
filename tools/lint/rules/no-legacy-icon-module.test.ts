import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-legacy-icon-module.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-legacy-icon-module', () => {
  ruleTester.run('no-legacy-icon-module', rule, {
    valid: [
      // No NgIconsModule at all.
      {
        code: `@Component({ imports: [SomeOtherModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
      // The registry API, not the legacy module.
      {
        code: `@Component({ providers: [provideIcons({ lucideUsers })] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
    ],
    invalid: [
      // The call form is the one anybody actually reintroduces. The legacy API is
      // reached for as NgIconsModule.withIcons({ ... }), not as a bare identifier,
      // so a rule that matched only the identifier missed its own primary target.
      {
        code: `@Component({ imports: [NgIconsModule.withIcons({ lucideUsers })] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'legacyIconModule' }],
      },
      {
        code: `@Component({ imports: [NgIconsModule] }) export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'legacyIconModule' }],
      },
    ],
  });
});
