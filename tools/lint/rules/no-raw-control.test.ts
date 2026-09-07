import { test } from 'node:test';
import { RuleTester } from 'eslint';
import angular from 'angular-eslint';
import rule from './no-raw-control.ts';

const ruleTester = new RuleTester({
  languageOptions: { parser: angular.templateParser },
});

test('no-raw-control', () => {
  ruleTester.run('no-raw-control', rule, {
    valid: [
      { code: `<button hlmBtn>Save</button>`, filename: 'x.html' },
      { code: `<button hlmSidebarMenuButton>Nav</button>`, filename: 'x.html' },
      { code: `<input hlmInput />`, filename: 'x.html' },
      { code: `<div>plain containers are not controls</div>`, filename: 'x.html' },
    ],
    invalid: [
      { code: `<button>Save</button>`, filename: 'x.html', errors: [{ messageId: 'rawControl' }] },
      { code: `<input />`, filename: 'x.html', errors: [{ messageId: 'rawControl' }] },
      { code: `<table></table>`, filename: 'x.html', errors: [{ messageId: 'rawControl' }] },
    ],
  });
});
