#!/usr/bin/env node
// Prints the subsystem areas a diff touches, one line, comma separated.
//
// CI runs this immediately after checkout — before installing .NET, Rust, or a Playwright
// browser — and gates those installs on the answer. A prose-only pull request therefore
// pays for a checkout and nothing else, and the 1:24 that `npx playwright install` costs
// is not spent proving a README still parses.
//
// It exists as its own entry point so the classification lives in exactly one place.
// The alternative was a `paths-ignore:` filter in the workflow, which would have restated
// every rule in select.ts as YAML globs, in a second dialect, with no tests — precisely the
// duplicated-by-hand fact CLAUDE.md's DRY rule exists to prevent.

import { execSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { activeAreas } from './select.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * The files that changed between `ref` and HEAD.
 *
 * Three dots, not two: it diffs against the merge base, so a branch is judged on what it
 * changed rather than on everything that landed on main while it was open.
 */
export function changedSince(ref: string): string[] {
  const out = execSync(`git diff --name-only ${ref}...HEAD`, { cwd: ROOT, encoding: 'utf8' });
  return out.split('\n').map((line) => line.trim()).filter(Boolean);
}

function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error('Usage: node tools/verify/areas.ts <git-ref>');
    process.exit(1);
  }
  console.log([...activeAreas(changedSince(ref))].join(','));
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  main();
}
