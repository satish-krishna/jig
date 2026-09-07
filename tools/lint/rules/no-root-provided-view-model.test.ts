import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-root-provided-view-model.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-root-provided-view-model', () => {
  ruleTester.run('no-root-provided-view-model', rule, {
    valid: [
      // A ViewModel with no providedIn is component-provided, which is correct.
      {
        code: `@Injectable() class XViewModel {}`,
        filename: '/app/features/users/x.view-model.ts',
      },
      // A plain service is exactly what providedIn: 'root' is for.
      {
        code: `@Injectable({ providedIn: 'root' }) class XService {}`,
        filename: '/app/features/users/x.service.ts',
      },
    ],
    invalid: [
      {
        code: `@Injectable({ providedIn: 'root' }) class XViewModel {}`,
        filename: '/app/features/users/x.view-model.ts',
        errors: [{ messageId: 'rootProvidedViewModel' }],
      },
    ],
  });
});
