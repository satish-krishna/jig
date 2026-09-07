import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-unregistered-icon.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-unregistered-icon', () => {
  ruleTester.run('no-unregistered-icon', rule, {
    valid: [
      // Registered inside a component's providers.
      {
        code: `
          import { lucideUsers } from '@ng-icons/lucide';
          @Component({ providers: [provideIcons({ lucideUsers })] })
          export class X {}
        `,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
      // Registered at module scope, outside any class -- the app.config.ts pattern.
      {
        code: `
          import { lucideUsers, lucidePlus } from '@ng-icons/lucide';
          export const appConfig = { providers: [provideIcons({ lucideUsers, lucidePlus })] };
        `,
        filename: '/repo/frontend/src/app/app.config.ts',
      },
      // Neither an icon import nor a registration call: out of scope entirely.
      {
        code: `export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
      // A type-only import is not a glyph.
      {
        code: `import type { IconName } from '@ng-icons/lucide'; export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
      // A bare side-effect import is not a glyph.
      {
        code: `import '@ng-icons/lucide'; export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
      },
    ],
    invalid: [
      {
        code: `import { lucideUsers } from '@ng-icons/lucide'; export class X {}`,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'unregisteredIcon' }],
      },
      // Eight glyphs imported, no provideIcons anywhere: still exactly one
      // report -- one per file, not one per glyph.
      {
        code: `
          import {
            lucideUsers, lucidePlus, lucideSun, lucideMoon,
            lucideTrash2, lucideComponent, lucidePanelLeft, lucideExternalLink,
          } from '@ng-icons/lucide';
          export class X {}
        `,
        filename: '/repo/frontend/src/app/features/users/x.ts',
        errors: [{ messageId: 'unregisteredIcon' }],
      },
    ],
  });
});
