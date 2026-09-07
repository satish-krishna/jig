import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-unknown-primitive.ts';

const ruleTester = new RuleTester({ languageOptions: { parser: angular.templateParser } });

test('no-unknown-primitive', () => {
  ruleTester.run('no-unknown-primitive', rule, {
    valid: [
      { code: `<button hlmBtn>x</button>`, filename: 'x.html' },
      { code: `<hlm-accordion></hlm-accordion>`, filename: 'x.html' },
      // Both forms of a combined selector are real. 138 of 318 nova selectors
      // declare both, so treating them as disjoint would reject correct code.
      { code: `<div hlmAccordion></div>`, filename: 'x.html' },
    ],
    invalid: [
      { code: `<button hlmButton>x</button>`, filename: 'x.html', errors: [{ messageId: 'unknownPrimitive' }] },
      { code: `<hlm-nonsense></hlm-nonsense>`, filename: 'x.html', errors: [{ messageId: 'unknownPrimitive' }] },
      // The right name in the wrong form is exactly what this rule exists to catch.
      { code: `<div hlmSelectTrigger></div>`, filename: 'x.html', errors: [{ messageId: 'unknownPrimitive' }] },
    ],
  });
});
