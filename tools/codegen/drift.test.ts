import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { compareArtifacts } from './drift.ts';

const ok = (label, committed, fresh) => ({ label, committed, fresh });

describe('compareArtifacts', () => {
  test('passes when every artifact matches what codegen would emit', () => {
    const result = compareArtifacts([ok('openapi.json', '{"a":1}', '{"a":1}')]);
    assert.equal(result.ok, true);
  });

  test('fails and names the artifact that drifted', () => {
    const result = compareArtifacts([ok('api-types.ts', 'type A = 1;', 'type A = 2;')]);
    assert.equal(result.ok, false);
    assert.match(result.message, /api-types\.ts/);
  });

  test('tells the reader how to fix it', () => {
    // The message is the whole product here: whoever hits this is looking at a red
    // gate for a file they never edited, and needs to know it is regenerated.
    const result = compareArtifacts([ok('api-types.ts', 'type A = 1;', 'type A = 2;')]);
    assert.match(result.message, /npm run codegen/);
  });

  test('fails when a generated artifact was never committed', () => {
    const result = compareArtifacts([ok('api-types.ts', null, 'type A = 1;')]);
    assert.equal(result.ok, false);
    assert.match(result.message, /missing/i);
  });

  test('names every drifted artifact, not just the first', () => {
    const result = compareArtifacts([
      ok('openapi.json', '{"a":1}', '{"a":2}'),
      ok('api-types.ts', 'type A = 1;', 'type A = 2;'),
    ]);
    assert.match(result.message, /openapi\.json/);
    assert.match(result.message, /api-types\.ts/);
  });

  test('ignores line-ending differences', () => {
    // .gitattributes normalizes the repo to LF, but openapi-typescript writing into a
    // temp dir on Windows can still emit CRLF. That is not drift, and a gate that
    // failed on it would be red on every Windows run for no reason at all.
    const result = compareArtifacts([ok('api-types.ts', 'type A = 1;\ntype B = 2;\n', 'type A = 1;\r\ntype B = 2;\r\n')]);
    assert.equal(result.ok, true);
  });

  test('ignores a trailing-newline difference', () => {
    const result = compareArtifacts([ok('openapi.json', '{"a":1}\n', '{"a":1}')]);
    assert.equal(result.ok, true);
  });
});
