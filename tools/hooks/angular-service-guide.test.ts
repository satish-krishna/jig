import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isReusableUnit, GUIDE_SKILL } from './angular-service-guide.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('nudges on a new repository, service, or transport', () => {
  assert.equal(isReusableUnit('frontend/src/app/repositories/order.repository.ts'), true);
  assert.equal(isReusableUnit('D:\\Repos\\jig\\frontend\\src\\app\\menu\\menu.service.ts'), true);
  assert.equal(isReusableUnit('/repo/frontend/src/app/transport/ws.transport.ts'), true);
  assert.equal(isReusableUnit('frontend/src/app/operations/order.operations.ts'), true);
});

test('nudges on anything under capabilities', () => {
  assert.equal(isReusableUnit('frontend/src/app/capabilities/keychain.ts'), true);
  assert.equal(isReusableUnit('frontend/src/app/capabilities/fs/read.ts'), true);
});

test('stays silent on tests, non-service source, and other trees', () => {
  assert.equal(isReusableUnit('frontend/src/app/repositories/order.repository.spec.ts'), false);
  assert.equal(isReusableUnit('frontend/src/app/features/users/users.component.ts'), false);
  assert.equal(isReusableUnit('services/api/src/Jig.Api/Users/GetUserEndpoint.cs'), false);
  assert.equal(isReusableUnit(''), false);
});

test('GUIDE_SKILL names a skill that actually exists', () => {
  const dir = join(ROOT, '.claude/skills', GUIDE_SKILL);
  assert.ok(existsSync(join(dir, 'SKILL.md')), `expected .claude/skills/${GUIDE_SKILL}/SKILL.md to exist`);
});
