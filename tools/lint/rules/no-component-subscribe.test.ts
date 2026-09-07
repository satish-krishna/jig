import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-component-subscribe.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-component-subscribe', () => {
  ruleTester.run('no-component-subscribe', rule, {
    valid: [
      // A plain service may subscribe.
      {
        code: `@Injectable() class XService { m() { this.x$.subscribe(() => {}); } }`,
        filename: '/app/features/users/x.service.ts',
      },
      // Scoped to @Component classes only. A ViewModel subscribes because
      // Transport.request() returns an Observable; extending this rule to
      // ViewModels is out of scope until the transport seam returns Promises.
      // Mirrors frontend/src/app/features/users/user-list.view-model.ts, which
      // subscribes twice and must stay exactly as it is.
      {
        code: `@Injectable() class XViewModel { load() { this.repo.list().subscribe({ next: () => {} }); } }`,
        filename: '/app/features/users/x.view-model.ts',
      },
    ],
    invalid: [
      {
        code: `@Component({}) class X { m() { this.x$.subscribe(() => {}); } }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'componentSubscribe' }],
      },
      {
        code: `@Component({}) class X { m() { this.repo.list().subscribe({ next: () => {} }); } }`,
        filename: '/app/shell/x.ts',
        errors: [{ messageId: 'componentSubscribe' }],
      },
    ],
  });
});
