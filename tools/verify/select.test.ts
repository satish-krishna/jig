import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { classify, activeAreas, selectSteps, ALL_AREAS, type Selectable } from './select.ts';

describe('classify', () => {
  test('maps each subsystem root to its area', () => {
    assert.equal(classify('services/api/src/Jig.Api/Program.cs'), 'dotnet');
    assert.equal(classify('apps/desktop/src-tauri/src/main.rs'), 'rust');
    assert.equal(classify('frontend/src/app/features/users/users.page.ts'), 'frontend');
    assert.equal(classify('tools/lint/rules/no-ng-model.ts'), 'tools');
  });

  test('treats generated wire contracts as their own area, not as frontend', () => {
    // A DTO regenerated from the API is not an authored frontend change: it needs
    // codegen freshness and a type-check, but no linting and no e2e.
    assert.equal(classify('frontend/src/app/contracts/generated/api-types.ts'), 'contracts');
    assert.equal(classify('contracts/openapi/openapi.json'), 'contracts');
  });

  test('treats prose as inert', () => {
    assert.equal(classify('CLAUDE.md'), 'docs');
    assert.equal(classify('README.md'), 'docs');
    assert.equal(classify('.bob/adr/0009-architecture-rules-are-compiler-errors.md'), 'docs');
    assert.equal(classify('docs/architecture/conduit.md'), 'docs');
  });

  test('rule docs are tooling data, not prose', () => {
    // tools/hooks/rule-docs.test.ts asserts every rule has its doc, so deleting one
    // turns the gate red with no code touched. A blanket docs skip would miss it.
    assert.equal(classify('docs/architecture/rules/no-ng-model.md'), 'tools');
  });

  test('an unrecognized path is unknown, never inert', () => {
    assert.equal(classify('some/new/thing.txt'), 'unknown');
    assert.equal(classify('package.json'), 'unknown');
  });
});

describe('activeAreas', () => {
  test('collects the areas the changed paths touch', () => {
    const areas = activeAreas(['services/api/src/Jig.Api/Program.cs', 'CLAUDE.md']);
    assert.deepEqual([...areas], ['dotnet']);
  });

  test('a docs-only change activates nothing', () => {
    assert.equal(activeAreas(['CLAUDE.md', 'docs/architecture/forms.md']).size, 0);
  });

  test('an unknown path fails safe by activating every area', () => {
    // The selector must never be the reason something reached main unverified. A path
    // it cannot classify is a path it cannot vouch for, so it runs the full gate.
    assert.deepEqual([...activeAreas(['package.json'])].sort(), [...ALL_AREAS].sort());
  });

  test('an empty change set fails safe too', () => {
    assert.deepEqual([...activeAreas([])].sort(), [...ALL_AREAS].sort());
  });
});

describe('selectSteps', () => {
  const steps = [
    { name: 'dotnet tests', areas: ['dotnet'] },
    { name: 'rust tests', areas: ['rust'] },
    { name: 'frontend build', areas: ['frontend', 'contracts'] },
    { name: 'e2e', areas: ['frontend'] },
  ] as const satisfies readonly Selectable[];

  test('runs a step when any of its areas is active', () => {
    const chosen = selectSteps(steps, new Set(['contracts'])).map((s) => s.name);
    assert.deepEqual(chosen, ['frontend build']);
  });

  test('a contracts change type-checks the frontend but does not run e2e', () => {
    // The e2e smoke is hermetic (playwright.config.ts), so no wire change can reach it.
    const chosen = selectSteps(steps, new Set(['contracts'])).map((s) => s.name);
    assert.ok(!chosen.includes('e2e'));
  });

  test('preserves the declared step order', () => {
    const chosen = selectSteps(steps, new Set(['rust', 'dotnet'])).map((s) => s.name);
    assert.deepEqual(chosen, ['dotnet tests', 'rust tests']);
  });

  test('selects nothing when no area is active', () => {
    assert.deepEqual(selectSteps(steps, new Set()), []);
  });
});
