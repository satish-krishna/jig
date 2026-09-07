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
import { writeFileSync, mkdirSync, readdirSync, statSync, readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { compareArtifacts } from './drift.ts';

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

/** File content, or null when the file was never committed. */
const readOrNull = (path) => (existsSync(path) ? readFileSync(path, 'utf8') : null);

// `--check` emits into a temp directory and diffs against the committed artifacts instead of
// overwriting them. It is the freshness half of the contract gate: proof that api-types.ts and
// openapi.json still match what the API serves. Nothing verified that before, so a .NET contract
// change committed without running codegen left the frontend type-checking against stale DTOs
// with CI fully green. It costs a dotnet build and a loopback boot, which is why it runs only in
// the `dotnet` and `contracts` lanes — where that build has already been paid for.
const CHECK = process.argv.includes('--check');

async function main() {
  const scratch = CHECK ? mkdtempSync(join(tmpdir(), 'jig-codegen-')) : null;
  const specOut = scratch ? join(scratch, 'openapi.json') : OPENAPI_OUT;
  const tsOut = scratch ? join(scratch, 'api-types.ts') : TS_OUT;

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

  mkdirSync(dirname(specOut), { recursive: true });
  writeFileSync(specOut, JSON.stringify(spec, null, 2) + '\n');
  console.log(`codegen: read ${Object.keys(spec.paths ?? {}).length} paths from the API`);

  mkdirSync(dirname(tsOut), { recursive: true });
  console.log('codegen: generating TypeScript DTOs…');
  execSync(`npx --yes openapi-typescript "${specOut}" -o "${tsOut}"`, { stdio: 'inherit', cwd: ROOT });

  if (!scratch) {
    console.log('codegen: done → frontend/src/app/contracts/generated/api-types.ts');
    return;
  }

  const result = compareArtifacts([
    { label: 'contracts/openapi/openapi.json', committed: readOrNull(OPENAPI_OUT), fresh: readFileSync(specOut, 'utf8') },
    {
      label: 'frontend/src/app/contracts/generated/api-types.ts',
      committed: readOrNull(TS_OUT),
      fresh: readFileSync(tsOut, 'utf8'),
    },
  ]);
  rmSync(scratch, { recursive: true, force: true });

  if (!result.ok) {
    console.error(result.message);
    process.exit(1);
  }
  console.log(result.message);
}

main();
