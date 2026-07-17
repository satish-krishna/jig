import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isReusableUnit } from './angular-service-guide.mjs';

test('nudges on a new repository, service, or transport', () => {
  assert.equal(isReusableUnit('frontend/src/app/repositories/order.repository.ts'), true);
  assert.equal(isReusableUnit('D:\\Repos\\jig\\frontend\\src\\app\\menu\\menu.service.ts'), true);
  assert.equal(isReusableUnit('/repo/frontend/src/app/transport/ws.transport.ts'), true);
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
