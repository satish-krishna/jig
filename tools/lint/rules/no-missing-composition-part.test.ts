import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-missing-composition-part.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-missing-composition-part', () => {
  ruleTester.run('no-missing-composition-part', rule, {
    valid: [
      {
        code: `<hlm-dialog-content><h2 hlmDialogTitle>t</h2></hlm-dialog-content>`,
        filename: 'x.html',
      },
      // Control flow must not hide the part: it still satisfies the container.
      {
        code: `<hlm-dialog-content>@if (x) { <h2 hlmDialogTitle>T</h2> }</hlm-dialog-content>`,
        filename: 'x.html',
      },
      {
        code: `<hlm-sheet-content><h2 hlmSheetTitle>t</h2></hlm-sheet-content>`,
        filename: 'x.html',
      },
      {
        code: `<hlm-alert-dialog-content><h2 hlmAlertDialogTitle>t</h2></hlm-alert-dialog-content>`,
        filename: 'x.html',
      },
    ],
    invalid: [
      {
        code: `<hlm-dialog-content><p>no title</p></hlm-dialog-content>`,
        filename: 'x.html',
        errors: [{ messageId: 'missingCompositionPart' }],
      },
    ],
  });
});
