#!/usr/bin/env node
// Contract codegen: emit the OpenAPI spec from the live API, then generate the
// frontend's TypeScript DTOs from it. One direction only — the .NET API is the
// source of truth for every wire shape, so HTTP and IPC cannot disagree.
//
// Strategy: FastEndpoints builds its OpenAPI document at runtime (NSwag), so we
// run the API on a loopback port, fetch /swagger/v1/swagger.json, write it, stop
// the API, then run openapi-typescript over the spec. Run-and-fetch is the most
// reliable cross-platform path; it needs no NSwag build-time plumbing.

import { spawn, execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const API_PROJ = join(ROOT, 'services', 'api', 'src', 'Jig.Api');
const API_CSPROJ = join(API_PROJ, 'Jig.Api.csproj');
const OPENAPI_OUT = join(ROOT, 'contracts', 'openapi', 'openapi.json');
const TS_OUT = join(ROOT, 'frontend', 'src', 'app', 'contracts', 'generated', 'api-types.ts');
const PORT = 5199;
const SPEC_URL = `http://127.0.0.1:${PORT}/swagger/v1/swagger.json`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function findDll() {
  // bin/Debug/net10.0/Jig.Api.dll (framework may bump; walk the tfm folder)
  const debug = join(API_PROJ, 'bin', 'Debug');
  const tfm = readdirSync(debug).find((d) => statSync(join(debug, d)).isDirectory());
  return join(debug, tfm, 'Jig.Api.dll');
}

function killTree(pid) {
  if (!pid) return;
  try {
    if (process.platform === 'win32') execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'ignore' });
    else process.kill(pid);
  } catch { /* already gone */ }
}

async function main() {
  console.log('codegen: building Jig.Api…');
  execSync(`dotnet build "${API_CSPROJ}" -c Debug -v q --nologo`, { stdio: 'inherit' });

  console.log(`codegen: starting API on :${PORT} to emit OpenAPI…`);
  const api = spawn('dotnet', [findDll()], {
    env: { ...process.env, ASPNETCORE_URLS: `http://127.0.0.1:${PORT}`, ASPNETCORE_ENVIRONMENT: 'Development' },
    stdio: 'ignore',
  });

  let spec = null;
  try {
    for (let i = 0; i < 60; i++) {
      try {
        const res = await fetch(SPEC_URL);
        if (res.ok) { spec = await res.json(); break; }
      } catch { /* not up yet */ }
      await sleep(500);
    }
  } finally {
    killTree(api.pid);
  }

  if (!spec) {
    console.error('codegen: API did not serve the OpenAPI spec in time.');
    process.exit(1);
  }

  mkdirSync(dirname(OPENAPI_OUT), { recursive: true });
  writeFileSync(OPENAPI_OUT, JSON.stringify(spec, null, 2) + '\n');
  console.log(`codegen: wrote ${Object.keys(spec.paths ?? {}).length} paths to contracts/openapi/openapi.json`);

  mkdirSync(dirname(TS_OUT), { recursive: true });
  console.log('codegen: generating TypeScript DTOs…');
  execSync(`npx --yes openapi-typescript "${OPENAPI_OUT}" -o "${TS_OUT}"`, { stdio: 'inherit', cwd: ROOT });
  console.log('codegen: done → frontend/src/app/contracts/generated/api-types.ts');
}

main();
