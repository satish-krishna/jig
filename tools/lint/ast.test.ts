import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tierOf } from './ast.ts';

test('features and shell are containers', () => {
  assert.equal(tierOf('/repo/frontend/src/app/features/users/user-list.view.ts'), 'container');
  assert.equal(tierOf('/repo/frontend/src/app/shell/app-shell.ts'), 'container');
});

test('showcase, forms and the root component are presentational', () => {
  assert.equal(tierOf('/repo/frontend/src/app/showcase/pages/badge.page.ts'), 'presentational');
  assert.equal(tierOf('/repo/frontend/src/app/forms/schema-form.ts'), 'presentational');
  assert.equal(tierOf('/repo/frontend/src/app/app.ts'), 'presentational');
});

test('windows separators are handled', () => {
  assert.equal(tierOf('D:\\repo\\frontend\\src\\app\\features\\users\\x.ts'), 'container');
});

test('anything else is presentational, which is the safe default', () => {
  // A new folder should not silently acquire container rules. Adding one to the
  // container tier is a decision, made in this file, visible in a diff.
  assert.equal(tierOf('/repo/frontend/src/app/theme/theme.service.ts'), 'presentational');
});
