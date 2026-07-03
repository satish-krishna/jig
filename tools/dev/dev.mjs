#!/usr/bin/env node
// Dev loop: run the Angular dev server (frontend HMR) and the .NET watcher
// (backend hot reload) together, so a change gives near-instant compile feedback
// instead of a full build. Output is line-prefixed [web]/[api] so it is easy to
// monitor for errors. LSP diagnostics are the type-check backup.
//
// This speeds the INNER loop only. It does not run tests. Run `npm run verify`
// before committing — HMR being green is not the gate.
//
// For the desktop shell (Rust + WebView), use `cargo tauri dev` instead; it opens
// a window, so it is on-demand rather than part of this headless loop.

import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const win = process.platform === 'win32';

const procs = [
  { tag: 'web', cmd: 'npm', args: ['--prefix', 'frontend', 'run', 'start'] },
  { tag: 'api', cmd: 'dotnet', args: ['watch', 'run', '--project', 'services/api/src/Jig.Api'] },
];

const children = procs.map(({ tag, cmd, args }) => {
  const child = spawn(cmd, args, { cwd: ROOT, shell: win });
  const forward = (stream) => {
    let buf = '';
    stream.on('data', (d) => {
      buf += d.toString();
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) process.stdout.write(`[${tag}] ${line}\n`);
    });
  };
  forward(child.stdout);
  forward(child.stderr);
  child.on('exit', (code) => process.stdout.write(`[${tag}] exited with code ${code}\n`));
  return child;
});

function shutdown() {
  for (const child of children) child.kill();
  process.exit(0);
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
