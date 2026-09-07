import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-raw-palette-color.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-raw-palette-color', () => {
  ruleTester.run('no-raw-palette-color', rule, {
    valid: [
      { code: `<div class="bg-card"></div>`, filename: 'x.html' },
      { code: `<div class="text-muted-foreground"></div>`, filename: 'x.html' },
      { code: `<div class="sm:max-w-[425px]"></div>`, filename: 'x.html' },
    ],
    invalid: [
      { code: `<div class="bg-blue-500"></div>`, filename: 'x.html', errors: [{ messageId: 'rawPaletteColor' }] },
      { code: `<div class="text-gray-700"></div>`, filename: 'x.html', errors: [{ messageId: 'rawPaletteColor' }] },
      { code: `<div class="bg-[#0af]"></div>`, filename: 'x.html', errors: [{ messageId: 'rawPaletteColor' }] },
      { code: `<div class="dark:bg-blue-600"></div>`, filename: 'x.html', errors: [{ messageId: 'rawPaletteColor' }] },
      { code: `<div class="text-white"></div>`, filename: 'x.html', errors: [{ messageId: 'rawPaletteColor' }] },
    ],
  });
});
