import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guardedPath } from './guard-ruleset.mjs';

test('guards the layer map and the analyzer sources', () => {
  assert.equal(guardedPath('D:\\Repos\\jig\\tools\\analyzers\\Jig.Analyzers\\ArchLayers.txt'), true);
  assert.equal(guardedPath('/repos/jig/tools/analyzers/Jig.Analyzers/LayerDependencyAnalyzer.cs'), true);
});

test('guards the wiring and the guard itself', () => {
  assert.equal(guardedPath('/repos/jig/services/api/src/Directory.Build.props'), true);
  assert.equal(guardedPath('/repos/jig/tools/hooks/guard-ruleset.mjs'), true);
  assert.equal(guardedPath('/repos/jig/.claude/settings.json'), true);
});

test('leaves ordinary source alone', () => {
  assert.equal(guardedPath('/repos/jig/services/api/src/Jig.Api/Users/GetUserEndpoint.cs'), false);
  assert.equal(guardedPath('/repos/jig/frontend/src/app/repositories/user.repository.ts'), false);
  assert.equal(guardedPath(''), false);
});
