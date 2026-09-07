import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-appearance-on-primitive.ts';

const ruleTester = new RuleTester({ languageOptions: { parser: angular.templateParser } });

test('no-appearance-on-primitive', () => {
  ruleTester.run('no-appearance-on-primitive', rule, {
    valid: [
      // Layout, dimension, margin and position are all fine on a primitive.
      { code: `<button hlmBtn class="w-full">x</button>`, filename: 'x.html' },
      { code: `<div hlmCardFooter class="justify-between"></div>`, filename: 'x.html' },
      { code: `<hlm-dialog-content class="sm:max-w-[425px]"></hlm-dialog-content>`, filename: 'x.html' },
      // Not a primitive, so its appearance is its own business.
      { code: `<div class="bg-muted p-4"></div>`, filename: 'x.html' },
      // Alignment keywords are layout, not typography.
      { code: `<button hlmBtn class="text-left">x</button>`, filename: 'x.html' },
      // hlm-resizable-group's own classes() call sets no decoration at all
      // (`group flex h-full w-full data-[panel-group-direction=vertical]:flex-col`)
      // — a call-site border/rounded is pure addition, not an override.
      { code: `<hlm-resizable-group class="rounded-lg border"></hlm-resizable-group>`, filename: 'x.html' },
      // hlm-spinner has no size input; overriding its own text-size class is
      // the only sizing API spartan exposes for it — the one documented
      // exception, see docs/architecture/rules/no-appearance-on-primitive.md.
      { code: `<hlm-spinner class="text-xl" />`, filename: 'x.html' },
    ],
    invalid: [
      { code: `<button hlmBtn class="bg-muted">x</button>`, filename: 'x.html', errors: [{ messageId: 'appearanceOnPrimitive' }] },
      { code: `<hlm-alert class="rounded-none"></hlm-alert>`, filename: 'x.html', errors: [{ messageId: 'appearanceOnPrimitive' }] },
      // Prefixes are stripped before classifying.
      { code: `<button hlmBtn class="dark:bg-blue-600">x</button>`, filename: 'x.html', errors: [{ messageId: 'appearanceOnPrimitive' }] },
      // hlm-command's own classes() call sets decoration too (`rounded-xl`
      // among them) — a call-site `border` is a real override of that family,
      // even though `border` itself is not the exact class the primitive uses.
      { code: `<hlm-command class="border"></hlm-command>`, filename: 'x.html', errors: [{ messageId: 'appearanceOnPrimitive' }] },
    ],
  });
});
