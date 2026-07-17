import { test } from 'node:test';
import assert from 'node:assert/strict';
import { guardedPath } from './guard-ruleset.mjs';

test('guards the layer map', () => {
  assert.equal(guardedPath('D:\\Repos\\jig\\tools\\analyzers\\Jig.Analyzers\\ArchLayers.txt'), true);
  assert.equal(guardedPath('/repos/jig/tools/analyzers/Jig.Analyzers/ArchLayers.txt'), true);
});

test('leaves the analyzer engine editable', () => {
  // The rule is guarded; the engine that computes it is not. Weakening ArchLayers.txt
  // leaves every test green, so it needs a gate. Gutting the analyzer turns its own
  // tests red, so it does not — and guarding it once blocked its own bugfix.
  assert.equal(guardedPath('/repos/jig/tools/analyzers/Jig.Analyzers/LayerDependencyAnalyzer.cs'), false);
  assert.equal(guardedPath('/repos/jig/tools/analyzers/Jig.Analyzers/LayerRule.cs'), false);
  assert.equal(guardedPath('D:\\Repos\\jig\\tools\\analyzers\\Jig.Analyzers.Tests\\LayerRuleTests.cs'), false);
});

test('guards the wiring and the guard itself', () => {
  assert.equal(guardedPath('/repos/jig/services/api/src/Directory.Build.props'), true);
  assert.equal(guardedPath('/repos/jig/tools/hooks/guard-ruleset.mjs'), true);
});

test('leaves .claude/settings.json editable', () => {
  // settings.json holds every hook, so guarding it taxed every legitimate hook change
  // and blocked two of them in practice. Unregistering the guard from settings.json
  // still shows in the diff and CI — the same backstop that protects the analyzer engine
  // and everything else that cannot be locked from inside the repo. Guarding it bought
  // little and cost a hand-apply on every hook edit forever.
  assert.equal(guardedPath('/repos/jig/.claude/settings.json'), false);
  assert.equal(guardedPath('D:\\Repos\\jig\\.claude\\settings.json'), false);
});

test('leaves ordinary source alone', () => {
  assert.equal(guardedPath('/repos/jig/services/api/src/Jig.Api/Users/GetUserEndpoint.cs'), false);
  assert.equal(guardedPath('/repos/jig/frontend/src/app/repositories/user.repository.ts'), false);
  assert.equal(guardedPath(''), false);
});
