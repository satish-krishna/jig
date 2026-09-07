import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-unprovided-view-model.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-unprovided-view-model', () => {
  ruleTester.run('no-unprovided-view-model', rule, {
    valid: [
      // The reference shape: frontend/src/app/features/users/user-list.view.ts
      // declares providers: [UserListViewModel] and injects it.
      {
        code: `@Component({ providers: [XViewModel] }) class X { vm = inject(XViewModel); }`,
        filename: '/app/features/users/x.ts',
      },
      // inject() of a plain service needs no providers entry.
      {
        code: `@Component({}) class X { menu = inject(MenuService); }`,
        filename: '/app/shell/x.ts',
      },
    ],
    invalid: [
      {
        code: `@Component({}) class X { vm = inject(XViewModel); }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'unprovidedViewModel' }],
      },
      {
        code: `@Component({ providers: [OtherViewModel] }) class X { vm = inject(XViewModel); }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'unprovidedViewModel' }],
      },
    ],
  });
});
