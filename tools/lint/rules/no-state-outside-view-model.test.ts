import { test } from 'node:test';
import { RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import rule from './no-state-outside-view-model.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser, parserOptions: { project: false } },
});

test('no-state-outside-view-model', () => {
  ruleTester.run('no-state-outside-view-model', rule, {
    valid: [
      // computed is NOT flagged. It is derived by definition: over owned state the
      // signal is already reported, and over input()/toSignal() it is view logic
      // sitting where it belongs. Verified against sidebar-nav-item.ts and
      // schema-form.ts, both of which are correct as written.
      {
        code: `@Component({}) class X { readonly a = computed(() => 1); }`,
        filename: '/app/features/users/x.ts',
      },
      // Component API and edge conversions are never screen state.
      {
        code: `@Component({}) class X { readonly a = input.required(); }`,
        filename: '/app/features/users/x.ts',
      },
      {
        code: `@Component({}) class X { readonly a = toSignal(this.s.x$); }`,
        filename: '/app/features/users/x.ts',
      },
      // Presentational tier may own its state.
      {
        code: `@Component({}) class X { readonly a = signal(0); }`,
        filename: '/app/showcase/pages/badge.page.ts',
      },
      {
        code: `@Component({}) class X { readonly a = signal(0); }`,
        filename: '/app/forms/schema-form.ts',
      },
      // A ViewModel is where state belongs.
      {
        code: `@Injectable() class XViewModel { readonly a = signal(0); }`,
        filename: '/app/features/users/x.view-model.ts',
      },
    ],
    invalid: [
      // A form's own backing model signal is the same defect as the form() call
      // that wraps it, not a second one: this reports ONCE, on the form, not
      // twice. Mirrors frontend/src/app/features/users/user-form.ts, where line
      // 51's form() reports and line 50's backing `model` signal must not.
      {
        code: `@Component({}) class X { readonly model = signal({ name: '' }); readonly form = form(this.model, (path) => validateStandardSchema(path, schema)); }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'stateOutsideVm' }],
      },
      {
        code: `@Component({}) class X { readonly a = signal(0); }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'stateOutsideVm' }],
      },
      {
        code: `@Component({}) class X { readonly a = linkedSignal(() => 1); }`,
        filename: '/app/shell/x.ts',
        errors: [{ messageId: 'stateOutsideVm' }],
      },
      {
        code: `@Component({}) class X { readonly f = form(this.model); }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'stateOutsideVm' }],
      },
      // A module-scope const of the same name must NOT silence the component's
      // own property. The exemption resolves `this.model`; a bare identifier can
      // never reach a sibling property from a field initializer, so accepting one
      // only ever matched an out-of-scope binding and suppressed a real hit. All
      // three declarations here are violations: the component's `draft`, its
      // `other`, and the form.
      {
        code: `const draft = signal({}); @Component({}) class X { readonly draft = signal(0); readonly other = signal(0); readonly f = form(draft); }`,
        filename: '/app/features/users/x.ts',
        errors: [
          { messageId: 'stateOutsideVm' },
          { messageId: 'stateOutsideVm' },
          { messageId: 'stateOutsideVm' },
        ],
      },
      // The backing-model exemption is precise, not a blanket "any signal in a
      // class that also has a form()". A signal unrelated to the form still reports.
      {
        code: `@Component({}) class X { readonly model = signal({ name: '' }); readonly other = signal(0); readonly form = form(this.model); }`,
        filename: '/app/features/users/x.ts',
        errors: [{ messageId: 'stateOutsideVm' }, { messageId: 'stateOutsideVm' }],
      },
    ],
  });
});
