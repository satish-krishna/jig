import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-feature-inject-data.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-feature-inject-data', () => {
  ruleTester.run('no-feature-inject-data', rule, {
    valid: [
      // A ViewModel importing its repository is the shape we want — the whole
      // point of the ViewModel layer. This is the case the brief's own sketch
      // gets wrong: a naive "every file with a data import" predicate reports
      // here, and frontend/src/app/features/users/user-list.view-model.ts
      // legitimately imports UserRepository.
      {
        code: `import { UserRepository } from '../../repositories/user.repository'; @Injectable() class XViewModel { repo = inject(UserRepository); }`,
        filename: '/app/features/users/x.view-model.ts',
      },
      // UI registries are not data access.
      {
        code: `import { MenuService } from '../../menu'; @Component({}) class X { menu = inject(MenuService); }`,
        filename: '/app/features/users/x.ts',
      },
      {
        code: `import { ThemeService } from '../theme/theme.service'; @Component({}) class X { theme = inject(ThemeService); }`,
        filename: '/app/shell/x.ts',
      },
      {
        code: `import { Router } from '@angular/router'; @Component({}) class X { router = inject(Router); }`,
        filename: '/app/shell/x.ts',
      },
      // A plain file with no @Component declared, importing a data path, is out
      // of scope for this rule (it is not a view).
      {
        code: `import { UserRepository } from '../../repositories/user.repository'; export function helper() {}`,
        filename: '/app/features/users/x.helper.ts',
      },
    ],
    invalid: [
      {
        code: `import { UserRepository } from '../../repositories/user.repository'; @Component({}) class X { repo = inject(UserRepository); }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'featureInjectsData' }],
      },
      {
        code: `import { WIRE } from '../transport'; @Component({}) class X { wire = inject(WIRE); }`,
        filename: '/app/shell/x.ts',
        errors: [{ messageId: 'featureInjectsData' }],
      },
    ],
  });
});
